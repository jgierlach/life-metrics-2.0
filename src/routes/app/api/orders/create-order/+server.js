import fetch from 'node-fetch'
import { json } from '@sveltejs/kit'
import { updateChangelogInWebhook, sendNewOrderNotificationEmail } from '$lib/utils'
import { SHIPSTATION_API_KEY, SHIPSTATION_SECRET, SEND_GRID_API_KEY } from '$env/static/private'

export async function POST({ request, locals }) {
  const { orderPayload } = await request.json()

  const {
    brand_id,
    brand_name,
    order_number,
    order_source,
    order_date,
    customer_email,
    customer_name,
    recipient_company,
    fulfillment_channel,
    street1,
    city,
    state,
    postal_code,
    country,
    carrier,
    tracking_number,
    status,
    cost_of_shipment,
    referral_fee,
    total_paid,
    total_unit_quantity,
    total_cost_of_goods,
    notes,
    is_3pl_order,
    order_type,
    order_line_items,
  } = orderPayload

  try {
    // Step 1: Validate inventory first (but don't update yet)
    for (const lineItem of order_line_items) {
      const { product_id, quantity, sku } = lineItem

      const { data: productData, error: productFetchError } = await locals.supabase
        .from('products')
        .select('quantity')
        .eq('id', product_id)
        .single()

      if (productFetchError) {
        console.error('Error fetching product:', productFetchError)
        return json(
          {
            message: 'Failed to fetch product information.',
            error: productFetchError.message,
          },
          { status: 500 },
        )
      }

      // Check if sufficient inventory exists
      if (productData.quantity < quantity) {
        return json(
          {
            message: `Insufficient inventory for ${sku}. Available: ${productData.quantity}, Requested: ${quantity}`,
          },
          { status: 400 },
        )
      }
    }

    // Step 2: Create order in database
    const { data: orderData, error: orderError } = await locals.supabase
      .from('orders')
      .insert({
        brand_id,
        brand_name,
        order_number,
        order_source,
        order_type,
        order_date,
        customer_email,
        customer_name,
        recipient_company,
        fulfillment_channel,
        street1,
        city,
        state,
        postal_code,
        country,
        carrier,
        tracking_number,
        status,
        cost_of_shipment,
        referral_fee,
        total_paid,
        total_unit_quantity,
        total_cost_of_goods,
        notes,
        is_3pl_order: true,
        packaging_cost: null,
      })
      .select()

    if (orderError) {
      console.error('Error inserting order:', orderError)
      return json(
        {
          message: 'Failed to create order',
          error: orderError.message,
        },
        { status: 500 },
      )
    }

    // Grab the newly created order id
    const orderId = orderData[0].id

    // Step 3: Create order line items
    const orderLineItems = order_line_items.map((lineItem) => {
      return {
        ...lineItem,
        order_id: orderId,
      }
    })

    const { error: orderLineItemsError } = await locals.supabase
      .from('order_line_items')
      .insert(orderLineItems)

    if (orderLineItemsError) {
      console.error('Error inserting order line items:', orderLineItemsError)
      // Try to clean up the order if line items fail
      await locals.supabase.from('orders').delete().eq('id', orderId)
      return json(
        {
          message: 'Failed to create order line items',
          error: orderLineItemsError.message,
        },
        { status: 500 },
      )
    }

    // Step 3.5: Send new order notification email
    await sendNewOrderNotificationEmail(
      brand_id,
      order_number,
      brand_name,
      order_type,
      customer_name,
      street1,
      city,
      state,
      postal_code,
      country,
      orderId,
      SEND_GRID_API_KEY,
    )

    // Step 4: Update inventory
    for (const lineItem of order_line_items) {
      const { product_id, quantity, image_url, brand_id, brand_name, product_name, sku } = lineItem

      // Get current product data again (for accuracy)
      const { data: productData, error: productFetchError } = await locals.supabase
        .from('products')
        .select('quantity')
        .eq('id', product_id)
        .single()

      if (productFetchError) {
        console.error('Error re-fetching product for update:', productFetchError)
        continue // Skip this item but don't fail the whole order
      }

      const previousQuantity = productData.quantity || 0
      const newQuantity = Math.max(0, previousQuantity - quantity) // Safety check: ensure newQuantity is never negative
      const netChange = newQuantity - previousQuantity

      // Update the changelog
      try {
        await updateChangelogInWebhook(
          locals.supabase,
          previousQuantity,
          newQuantity,
          netChange,
          image_url,
          brand_id,
          brand_name,
          order_number,
          '3PL Client Portal',
          product_name,
          sku,
          product_id,
        )
      } catch (changelogError) {
        console.error('Error updating changelog:', changelogError)
        // Don't fail order for changelog issues
      }

      // Update the product quantity
      const { error: productUpdateError } = await locals.supabase
        .from('products')
        .update({ quantity: newQuantity })
        .eq('id', product_id)

      if (productUpdateError) {
        console.error('Error updating product quantity:', productUpdateError)
        // Log error but don't fail the order at this point
      }
    }

    // Step 5: Create order in ShipStation (non-blocking)
    let shipStationSuccess = false
    let shipStationError = null

    try {
      const shipstationData = {
        orderNumber: order_number,
        orderKey: order_number,
        orderDate: new Date().toISOString(),
        paymentDate: new Date().toISOString(),
        orderStatus: 'awaiting_shipment',
        customerEmail: customer_email,
        customerUsername: customer_email,
        internalNotes: notes,
        billTo: {
          name: customer_name,
          company: recipient_company,
          street1,
          city,
          state,
          postalCode: postal_code,
          country,
        },
        shipTo: {
          name: customer_name,
          company: recipient_company,
          street1,
          city,
          state,
          postalCode: postal_code,
          country,
        },
        items: order_line_items.map((lineItem) => ({
          sku: lineItem.sku,
          name: lineItem.product_name,
          imageUrl: lineItem.image_url,
          quantity: lineItem.quantity,
          unitPrice: lineItem.unit_price,
          warehouseLocation: '5505 O Street',
        })),
      }

      const shipStationResponse = await fetch('https://ssapi.shipstation.com/orders/createorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:
            'Basic ' +
            Buffer.from(`${SHIPSTATION_API_KEY}:${SHIPSTATION_SECRET}`).toString('base64'),
        },
        body: JSON.stringify(shipstationData),
      })

      if (shipStationResponse.ok) {
        shipStationSuccess = true
        console.log('Order created successfully in ShipStation')
      } else {
        const errorText = await shipStationResponse.text()
        shipStationError = `ShipStation API returned ${shipStationResponse.status}: ${errorText}`
        console.error('ShipStation creation failed:', shipStationError)
      }
    } catch (error) {
      shipStationError = error.message
      console.error('ShipStation creation error:', error)
    }

    // Return success response with ShipStation status
    return json({
      success: true,
      orderId,
      message: 'Order created successfully',
      shipStation: {
        success: shipStationSuccess,
        error: shipStationError,
      },
    })
  } catch (error) {
    console.error('Unexpected error during order creation:', error)
    return json(
      {
        message: 'An unexpected error occurred while creating the order',
        error: error.message,
      },
      { status: 500 },
    )
  }
}
