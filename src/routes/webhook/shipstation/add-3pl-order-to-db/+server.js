import { json } from '@sveltejs/kit'
import { findStoreNameBasedOnId, assignBrandIdBasedOnStoreName } from '$lib/utils'
import { SHIPSTATION_API_KEY, SHIPSTATION_SECRET, SEND_GRID_API_KEY } from '$env/static/private'
import {
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

    console.log('Webhook received:', event)

    // Load all products from the database
    const { data: products, error: productError } = await locals.supabase
      .from('products')
      .select('*')

    if (productError) {
      console.error('Error fetching products:', productError)
    }

    // Load all users from the database
    const { data: users, error: userError } = await locals.supabase.from('users').select('*')

    if (userError) {
      console.error('Error fetching users:', userError)
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
    // console.log('Fetched orders', JSON.stringify(orders, null, 2))

    // Load all of the stores in ShipStation
    const shipstationStores = await fetch('https://ssapi.shipstation.com/stores', {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(SHIPSTATION_API_KEY + ':' + SHIPSTATION_SECRET).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    })

    // Check if the shipstation stores came back as expected
    if (!shipstationStores.ok) {
      return json(
        { error: 'Failed to fetch ShipStation stores' },
        { status: shipstationStores.status },
      )
    }

    // Process the successful return of ShipStation stores
    const stores = await shipstationStores.json()

    // Initialize order line items array
    const allOrderLineItems = []

    // Loop through each order and process it
    for (const order of orders) {
      const {
        orderNumber,
        carrierCode,
        trackingNumber,
        shipTo,
        items,
        advancedOptions,
        customerEmail,
        orderDate,
        shippingAmount,
        customerNotes,
        externallyFulfilled,
      } = order

      const storeId = advancedOptions?.storeId
      const storeName = findStoreNameBasedOnId(storeId, stores)

      // Check if the webhook is detecting a manual order or Hometown Amazon or Hometown Walmart
      if (
        storeName === 'Manual Orders' ||
        storeName === 'Hometown Amazon' ||
        storeName === 'Hometown Walmart'
      ) {
        console.log('Exit due to either Manual Order source or Hometown Amazon or Hometown Walmart')
        continue
      }

      const brandId = assignBrandIdBasedOnStoreName(storeName)
      const brandName = users.find((user) => user?.email === brandId)?.brand_name || null

      console.log('brand Id after initialized', brandId)
      console.log('Brand Name after initialized', brandName)

      // Identify the order source
      const orderSource = advancedOptions?.source || null

      // Determine fulfillment channel
      const fulfillmentChannel = externallyFulfilled ? 'Amazon FBA' : 'Hometown'
      console.log('Externally Fulfilled:', externallyFulfilled)
      console.log('Fulfillment Channel:', fulfillmentChannel)

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

      // Create the order object
      const orderInsertObj = {
        order_number: orderNumber,
        order_date: orderDate,
        is_3pl_order: true,
        brand_id: brandId,
        brand_name: brandName, // Will be updated when we process items
        order_source: orderSource,
        customer_email: customerEmail,
        customer_name: shipTo?.name || null,
        recipient_company: shipTo?.company || null,
        street1: shipTo?.street1 || null,
        city: shipTo?.city || null,
        state: shipTo?.state || null,
        postal_code: shipTo?.postalCode || null,
        country: shipTo?.country || null,
        carrier: carrierCode,
        tracking_number: trackingNumber,
        status: 'Pending',
        fulfillment_channel: fulfillmentChannel, // Use the determined fulfillment channel
        cost_of_shipment: shippingAmount,
        referral_fee: calculateReferralFee(items, products, orderSource),
        total_unit_quantity: items.reduce((acc, item) => acc + (item?.quantity || 0), 0),
        total_paid: calculateTotalPaid(items, products),
        notes: customerNotes,
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
        console.log('Item:', JSON.stringify(item, null, 2))
        let sku = item?.sku
        let quantity = item?.quantity
        let imageUrl = item?.imageUrl
        let name = item?.name

        // Check if the item name matches any line items in the line_items_to_skip table
        const { data: lineItemToSkip, error: lineItemToSkipError } = await locals.supabase
          .from('line_items_to_skip')
          .select('*')
          .eq('brand_id', brandId)
          .eq('name', name)

        if (lineItemToSkipError) {
          console.error('Error checking line_items_to_skip table:', lineItemToSkipError)
        }

        // If a matching coupon is found, skip processing this item
        if (lineItemToSkip && lineItemToSkip.length > 0) {
          console.log('Line Item to Skip found, skipping item:', name)
          continue
        }

        // Check sku against the sku mapping table
        const { data, error } = await locals.supabase
          .from('brand_sku_mapping')
          .select('*')
          .eq('sku', sku)
          .eq('brand_id', brandId)

        // Initialize productId, costOfGood
        let productId = null
        let costOfGood = null

        // No sku is found in the sku mapping table that matches
        if (data?.length === 0) {
          console.log('No SKU mapping found for', sku)

          // Insert row into unmapped_skus table using the utility function
          await insertUnmappedSku(
            locals.supabase,
            sku,
            brandId,
            brandName,
            quantity,
            orderNumber,
            storeName,
            name,
            imageUrl,
          )

          // Send email notification about unmapped SKU
          // await sendUnmappedSkuNotification(sku, name, quantity, orderNumber, SEND_GRID_API_KEY)
        }

        // If sku mappings are found execute lookup and deduct inventory quantity from correct product
        if (data?.length > 0) {
          // Process each SKU mapping sequentially
          for (const skuMap of data) {
            console.log('SKU MAP', skuMap)

            const quantityToDeduct = skuMap.quantity_to_deduct * quantity
            productId = skuMap.product_id

            console.log('QUANTITY TO DEDUCT', quantityToDeduct)

            // Fetch current inventory for this product
            const { data: inventoryData, error: fetchError } = await locals.supabase
              .from('products')
              .select('*')
              .eq('id', skuMap.product_id)
              .single()

            if (fetchError) {
              console.error(
                `Error fetching inventory for product_id ${skuMap.product_id}:`,
                fetchError,
              )
            }

            if (!inventoryData) {
              console.warn(`No inventory found for product_id ${skuMap.product_id}`)
            }

            // Set the costOfGood from inventory data
            costOfGood = inventoryData?.cost_of_good || null

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
            console.log('CURRENT QUANTITY', previousQuantity)
            const newQuantity = Math.max(0, previousQuantity - quantityToDeduct)
            console.log('NEW QUANTITY', newQuantity)

            const netChange = newQuantity - previousQuantity

            // Update the inventory changelog using the utility function
            await updateChangelogInWebhook(
              locals.supabase,
              previousQuantity,
              newQuantity,
              netChange,
              imageUrl,
              brandId,
              brandName,
              orderNumber,
              storeName,
              item?.name,
              skuMap?.sku,
              skuMap?.product_id,
            )

            // Update inventory using the utility function
            await updateProductQuantity(locals.supabase, newQuantity, skuMap.product_id)
          }
        }

        // Check if error is returned from Supabase
        if (error) {
          console.error('Supabase Error: fetching sku mapping:', error)
        }

        // Get unit price - try from item first, then lookup in products
        let unitPrice = item?.unitPrice || 0
        // if (unitPrice === 0 || unitPrice === undefined) {
        //   const product = products.find((product) => product?.sku === sku)
        //   unitPrice = product?.price || 0
        // }

        // Create order line item
        const orderLineItem = {
          order_id,
          sku: item.sku || null,
          asin: item.upc || null, // Using UPC as a proxy for ASIN
          product_name: item.name || null,
          image_url: item.imageUrl || null,
          product_id: productId || null,
          lot_number: null,
          expiration_date: null,
          quantity: item.quantity || 1,
          unit_price: unitPrice,
          cost_of_good: costOfGood,
          brand_id: brandId || null,
          brand_name: brandName || null,
        }

        console.log('Order Line Item:', orderLineItem)
        allOrderLineItems.push(orderLineItem)
      }

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
    }

    console.log('All Order Line Items:', JSON.stringify(allOrderLineItems, null, 2))

    // Insert all order line items into the database
    if (allOrderLineItems.length > 0) {
      const { data, error } = await locals.supabase
        .from('order_line_items')
        .insert(allOrderLineItems)

      if (error) {
        console.error('Error inserting order line items:', error)
        return json({ error: 'Failed to process order line items' }, { status: 500, headers })
      }

      console.log('Order line items inserted successfully:', data)
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
