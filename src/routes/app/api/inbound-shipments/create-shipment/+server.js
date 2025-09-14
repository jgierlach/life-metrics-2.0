import { json } from '@sveltejs/kit'

export async function POST({ request, locals }) {
  try {
    const {
      shipment_number,
      brand_id,
      brand_name,
      bol_number,
      carrier,
      tracking_number,
      destination,
      date,
      cost_of_shipment,
      status,
      total_unit_quantity,
      street1,
      city,
      state,
      postal_code,
      country,
      shipment_line_items,
    } = await request.json()

    console.log('TOTAL UNIT QUANTITY', total_unit_quantity)

    const inboundShipment = {
      shipment_number,
      brand_id,
      brand_name,
      bol_number,
      carrier,
      tracking_number,
      destination,
      date,
      cost_of_shipment,
      status,
      total_unit_quantity,
      total_counted_quantity: 0,
      street1,
      city,
      state,
      postal_code,
      country,
    }

    // Insert data
    const { data: inboundShipmentData, error: inboundShipmentError } = await locals.supabase
      .from('inbound_shipments')
      .insert([inboundShipment])
      .select()

    // Handle Supabase errors
    if (inboundShipmentError) {
      console.error('Supabase Insert Error:', inboundShipmentError)
      return json(
        { message: 'Inbound shipment creation failed.', error: inboundShipmentError.message },
        { status: 500 },
      )
    }

    console.log('Inbound shipment data:', inboundShipmentData)

    const inboundShipmentId = inboundShipmentData[0].id

    // Add inbound_shipment_id to each line item
    const lineItemsWithShipmentId = shipment_line_items.map((item) => ({
      ...item,
      inbound_shipment_id: inboundShipmentId,
    }))

    const { data: inboundShipmentLineItemsData, error: inboundShipmentLineItemsError } =
      await locals.supabase
        .from('inbound_shipment_line_items')
        .insert(lineItemsWithShipmentId)
        .select()

    if (inboundShipmentLineItemsError) {
      console.error('Supabase Insert Error:', inboundShipmentLineItemsError)
      return json(
        {
          message: 'Inbound shipment line item creation failed.',
          error: inboundShipmentLineItemsError.message,
        },
        { status: 500 },
      )
    }

    // Update pending_quantity for each product
    for (const lineItem of shipment_line_items) {
      const { product_id, quantity } = lineItem

      // First, get the current pending_quantity for the product
      const { data: productData, error: productFetchError } = await locals.supabase
        .from('products')
        .select('pending_quantity')
        .eq('id', product_id)
        .single()

      if (productFetchError) {
        console.error('Error fetching product:', productFetchError)
        return json(
          {
            message: 'Failed to fetch product for pending quantity update.',
            error: productFetchError.message,
          },
          { status: 500 },
        )
      }

      // Calculate new pending_quantity (add to existing value, default to 0 if null)
      const currentPendingQuantity = productData.pending_quantity || 0
      const newPendingQuantity = currentPendingQuantity + quantity

      // Update the product with the new pending_quantity
      const { error: productUpdateError } = await locals.supabase
        .from('products')
        .update({ pending_quantity: newPendingQuantity })
        .eq('id', product_id)

      if (productUpdateError) {
        console.error('Error updating product pending quantity:', productUpdateError)
        return json(
          {
            message: 'Failed to update product pending quantity.',
            error: productUpdateError.message,
          },
          { status: 500 },
        )
      }
    }

    return json({ message: 'Inbound shipment was created!', inboundShipmentData }, { status: 201 })
  } catch (err) {
    console.error('Server Error:', err)
    return json({ message: 'Internal server error.' }, { status: 500 })
  }
}
