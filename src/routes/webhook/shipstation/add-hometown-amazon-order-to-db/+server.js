import { json } from '@sveltejs/kit'
import { SHIPSTATION_API_KEY, SHIPSTATION_SECRET, SEND_GRID_API_KEY } from '$env/static/private'
import {
  sendUnmappedSkuNotification,
  insertUnmappedSku,
  updateChangelogInWebhook,
  updateProductQuantity,
  calculateTotalPaid,
  calculateReferralFee,
  updateOrderWithBrandIdAndBrandName,
} from '$lib/utils'

// Disable CSRF protection for this webhook route
export const config = {
  csrf: false,
}

export async function POST({ request, locals }) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*', // Allow requests from any origin
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    const event = await request.json()

    console.log('Webhook received on New Order:', event)

    // Load all products from the database
    const { data: products, error: productError } = await locals.supabase
      .from('products')
      .select('*')

    if (productError) {
      console.error('Error fetching products:', productError)
    }

    // Check if the event contains a resource_url
    if (!event.resource_url) {
      return json(
        { error: 'Invalid webhook payload: no resource_url provided' },
        { status: 400, headers },
      )
    }

    // Fetch order data from ShipStation using the resource_url
    const response = await fetch(event.resource_url, {
      headers: {
        Authorization: `Basic ${Buffer.from(SHIPSTATION_API_KEY + ':' + SHIPSTATION_SECRET).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch order data:', response.status, response.statusText)
      return json({ error: 'Failed to fetch order data' }, { status: 500, headers })
    }

    const { orders } = await response.json()
    console.log('Fetched orders', JSON.stringify(orders, null, 2))

    // Initialize order line items array
    const orderLineItems = []

    // Loop through each order and process it
    for (const order of orders) {
      const { orderId, orderNumber, shipTo, items, customerEmail, orderDate, externallyFulfilled } =
        order

      // Check if order already exists in database
      const { data: existingOrder, error: existingOrderError } = await locals.supabase
        .from('orders')
        .select('id')
        .eq('order_number', orderNumber)
        .single()

      if (existingOrderError && existingOrderError.code !== 'PGRST116') {
        console.error('Error checking for existing order:', existingOrderError)
        continue
      }

      if (existingOrder) {
        console.log(`Order ${orderNumber} already exists in database, skipping...`)
        continue
      }

      // Determine fulfillment channel
      // const fulfillmentChannel =
      //   shipTo?.street1 === null || shipTo?.street1 === '' ? 'Amazon FBA' : 'Hometown'
      const fulfillmentChannel = externallyFulfilled ? 'Amazon FBA' : 'Hometown'
      console.log('Externally Fulfilled:', externallyFulfilled)
      console.log('Fulfillment Channel:', fulfillmentChannel)

      // Create the order object
      const orderInsertObj = {
        order_number: orderNumber,
        order_date: orderDate,
        is_3pl_order: false,
        brand_id: null,
        brand_name: null,
        order_source: 'amazon', // or whatever is correct
        customer_email: customerEmail,
        customer_name: order?.shipTo?.name || null,
        recipient_company: order?.shipTo?.company || null,
        street1: order?.shipTo?.street1 || null,
        city: order?.shipTo?.city || null,
        state: order?.shipTo?.state || null,
        postal_code: order?.shipTo?.postalCode || null,
        country: order?.shipTo?.country || null,
        carrier: null,
        tracking_number: null,
        status: 'Pending',
        fulfillment_channel: fulfillmentChannel,
        cost_of_shipment: null,
        referral_fee: calculateReferralFee(items, products, 'amazon'),
        total_unit_quantity: order.items.reduce((acc, item) => acc + (item?.quantity || 0), 0),
        total_paid: calculateTotalPaid(items, products),
        notes: null,
      }

      // Insert the order into the database
      const { data: insertedOrder, error: orderInsertError } = await locals.supabase
        .from('orders')
        .insert([orderInsertObj])
        .select() // Needed to return the inserted row and get the UUID

      if (orderInsertError || !insertedOrder || !insertedOrder[0]) {
        console.error('Error inserting order:', orderInsertError)
        continue
      }

      const order_id = insertedOrder[0].id

      // Initialize cumulative FBA fee tracker for this order
      let cumulativeFbaFee = 0

      // Loop through each item in the order
      for (const item of items) {
        let sku = item?.sku
        let quantity = item?.quantity
        let imageUrl = item?.imageUrl
        let name = item?.name

        // Check sku against the sku mapping table
        const { data, error } = await locals.supabase
          .from('brand_sku_mapping')
          .select('*')
          .eq('sku', sku)

        // No sku is found in the sku mapping table that matches the sku in the order
        if (data?.length === 0) {
          console.log('No SKU mapping found for', sku)

          // Insert row into unmapped_skus table
          await insertUnmappedSku(
            locals.supabase,
            sku,
            null,
            null,
            quantity,
            orderNumber,
            'amazon',
            name,
            imageUrl,
          )

          // Send an alert with send grid
          // await sendUnmappedSkuNotification(sku, name, quantity, orderNumber, SEND_GRID_API_KEY)
        }

        // Initialize productId, costOfGood, brandId, brandName
        let productId = null
        let costOfGood = null
        let brandId = null
        let brandName = null

        // If sku mappings are found execute lookup and deduct inventory quantity from correct product
        if (data?.length > 0) {
          // You'll need to do a loop and deduct for every time a sku map is found
          for (const skuMap of data) {
            // Log the entire sku map inside the loop. I suspect that branded sku mapping is off on ids based on the import.
            console.log('SKU MAP', skuMap)

            const { product_id, sku, quantity_to_deduct } = skuMap
            productId = product_id
            const valueToSubtractFromInventoryQuantity = quantity_to_deduct * quantity

            // Fetch the current inventory quantity
            const { data: inventoryData, error: fetchError } = await locals.supabase
              .from('products')
              .select('*')
              .eq('id', product_id)
              .single()

            if (fetchError) {
              console.error(`Error fetching inventory for product_id ${product_id}:`, fetchError)
            }

            if (!inventoryData) {
              console.warn(`No inventory found for product_id ${product_id}`)
            }

            // If inventory data is found, set the costOfGood, brandId and brandName
            if (inventoryData) {
              costOfGood = inventoryData?.cost_of_good || null
              brandId = inventoryData?.brand_id || null
              brandName = inventoryData?.brand_name || null

              // Update the order with the correct brand_id and brand_name
              await updateOrderWithBrandIdAndBrandName(
                locals.supabase,
                brandId,
                brandName,
                order_id,
              )
            }

            // If the Fulfillment Channel is Amazon FBA we can calculate the cost of the shipment
            if (fulfillmentChannel === 'Amazon FBA') {
              const fbaFeePerItem = inventoryData?.fba_fee || 0
              const totalFbaFeeForThisItem = fbaFeePerItem * quantity
              cumulativeFbaFee += totalFbaFeeForThisItem

              console.log(
                `FBA fee for ${sku}: $${fbaFeePerItem} x ${quantity} = $${totalFbaFeeForThisItem}`,
              )
            }

            const previousQuantity = inventoryData?.quantity
            const newQuantity = Math.max(0, previousQuantity - valueToSubtractFromInventoryQuantity) // Prevent negative values

            const netChange = newQuantity - previousQuantity

            // Update the inventory changelog table
            await updateChangelogInWebhook(
              locals.supabase,
              previousQuantity,
              newQuantity,
              netChange,
              imageUrl,
              null,
              null,
              orderNumber,
              'amazon',
              item?.name,
              sku,
              null,
            )

            // Update the inventory quantity in the products table
            await updateProductQuantity(locals.supabase, newQuantity, product_id)
          }
        }

        // Check if error is returned from Supabase
        if (error) {
          console.error('Supabase Error: fetching sku mapping:', error)
        }

        let asin = item?.sku || null
        let unitPrice = item?.unitPrice || 0

        // If unitPrice is 0 perform a look up in asin prices tables
        if (unitPrice === 0 || unitPrice === undefined) {
          const product = products.find((product) => product?.asin === asin)
          if (product === undefined || product?.price === null) {
            unitPrice = 0
          } else {
            unitPrice = product?.price || 0
          }
        }

        const orderLineItem = {
          order_id,
          sku: item.sku || null,
          asin: item.sku || null, // adjust if you have true ASIN value
          product_name: item.name || null,
          image_url: item.imageUrl || null,
          product_id: productId || null,
          lot_number: null,
          expiration_date: null,
          quantity: quantity,
          unit_price: unitPrice,
          cost_of_good: costOfGood,
          brand_id: brandId || null,
          brand_name: brandName || null,
        }

        console.log('Order Line Item:', orderLineItem)

        orderLineItems.push(orderLineItem) // Push the item to the array
      } // End of items loop

      // After processing all items, update the order's cost_of_shipment if the fulfillment channel is Amazon FBA
      if (fulfillmentChannel === 'Amazon FBA') {
        const { error: updateError } = await locals.supabase
          .from('orders')
          .update({ cost_of_shipment: cumulativeFbaFee, status: 'Shipped' })
          .eq('id', order_id)

        if (updateError) {
          console.error('Error updating order cost_of_shipment:', updateError)
        } else {
          console.log(`Updated order ${orderNumber} cost_of_shipment to $${cumulativeFbaFee}`)
        }
      }
    } // End of orders loop

    console.log('All Order Line Items:', JSON.stringify(orderLineItems, null, 2))

    // Insert all order line items into the database
    const { data, error } = await locals.supabase.from('order_line_items').insert(orderLineItems)

    console.log('Insert result:', data)

    if (error) {
      console.error('Error inserting order line items data:', error)
      return json({ error: 'Failed to process order line items' }, { status: 500, headers })
    }

    return json({ success: true }, { headers })
  } catch (err) {
    console.error('Error processing webhook:', err)
    return json({ error: 'Invalid request' }, { status: 400, headers })
  }
}

// Handle CORS preflight requests
export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
