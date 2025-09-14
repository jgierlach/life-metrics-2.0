import { json } from '@sveltejs/kit'

export async function PUT({ request, locals }) {
  try {
    const { date_counted, inbound_shipment_id, product_id, id, counted_quantity } =
      await request.json()

    console.log('COUNTED QUANTITY', counted_quantity)

    // Update the inbound shipment line item with the counted_quantity and date_counted properties
    const { data: inboundShipmentLineItemData, error: inboundShipmentLineItemUpdateError } =
      await locals.supabase
        .from('inbound_shipment_line_items')
        .update({
          counted_quantity,
          date_counted,
        })
        .eq('id', id)

    if (inboundShipmentLineItemUpdateError) {
      console.error(
        'Error updating inbound shipment line item with counted_quantity and date_counted properties:',
        inboundShipmentLineItemUpdateError,
      )
      return json(
        {
          message:
            'Failed to update inbound shipment line item with counted_quantity and date_counted properties.',
          error: inboundShipmentLineItemUpdateError.message,
        },
        { status: 500 },
      )
    }

    // First, get the current pending_quantity and quantity for the product
    const { data: productData, error: productFetchError } = await locals.supabase
      .from('products')
      .select('pending_quantity, quantity')
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
    const newPendingQuantity = currentPendingQuantity - counted_quantity

    // Calculate the new quantity for the product (add to existing value, default to 0 if null)
    const currentQuantity = productData.quantity || 0
    const newQuantity = currentQuantity + counted_quantity

    // Update the product with the new pending_quantity
    const { error: productUpdateError } = await locals.supabase
      .from('products')
      .update({ pending_quantity: newPendingQuantity, quantity: newQuantity })
      .eq('id', product_id)

    if (productUpdateError) {
      console.error('Error updating product pending and actual quantity:', productUpdateError)
      return json(
        {
          message: 'Failed to update product pending and actual quantity.',
          error: productUpdateError.message,
        },
        { status: 500 },
      )
    }

    // NEW: Check if all line items for this shipment have been counted
    const { data: allLineItems, error: lineItemsError } = await locals.supabase
      .from('inbound_shipment_line_items')
      .select('counted_quantity, quantity')
      .eq('inbound_shipment_id', inbound_shipment_id)

    if (lineItemsError) {
      console.error('Error fetching line items for status check:', lineItemsError)
      // Don't fail the request, just log the error
    } else {
      // Calculate total counted quantity for the shipment
      const totalCountedQuantity = allLineItems.reduce((sum, item) => {
        return sum + (item.counted_quantity || 0)
      }, 0)

      // Check if all line items have counted_quantity > 0
      const allItemsCounted = allLineItems.every((item) => (item.counted_quantity || 0) > 0)

      if (allItemsCounted) {
        const hasDiscrepancies = allLineItems.some((item) => {
          // Assuming you store expected quantity somewhere
          return Math.abs((item.counted_quantity || 0) - (item.quantity || 0)) > 0
        })

        const newStatus = hasDiscrepancies ? 'Received with Discrepancies' : 'Received'

        const { error: shipmentUpdateError } = await locals.supabase
          .from('inbound_shipments')
          .update({
            status: newStatus,
            total_counted_quantity: totalCountedQuantity,
          })
          .eq('id', inbound_shipment_id)

        if (shipmentUpdateError) {
          console.error('Error updating inbound shipment status:', shipmentUpdateError)
          // Don't fail the request, just log the error
        } else {
          console.log(`Inbound Shipment ${inbound_shipment_id} status updated"`)
        }
      } else {
        // Update total_counted_quantity even if not all items are counted
        const { error: shipmentUpdateError } = await locals.supabase
          .from('inbound_shipments')
          .update({
            total_counted_quantity: totalCountedQuantity,
          })
          .eq('id', inbound_shipment_id)

        if (shipmentUpdateError) {
          console.error(
            'Error updating inbound shipment total_counted_quantity:',
            shipmentUpdateError,
          )
          // Don't fail the request, just log the error
        }
      }
    }

    return json(
      { message: 'Confirm count was successful!', inboundShipmentLineItemData },
      { status: 201 },
    )
  } catch (err) {
    console.error('Server Error:', err)
    return json({ message: 'Internal server error.' }, { status: 500 })
  }
}
