import { json, error } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request, locals }) {
  try {
    const { id } = await request.json()

    if (!id) {
      throw error(400, 'Missing id in request body')
    }

    // First, delete all associated line items
    const { error: lineItemsDeleteError } = await locals.supabase
      .from('inbound_shipment_line_items')
      .delete()
      .eq('inbound_shipment_id', id)

    if (lineItemsDeleteError) {
      console.error('Supabase delete line items error:', lineItemsDeleteError)
      throw error(500, 'Failed to delete inbound shipment line items')
    }

    // Then, delete the shipment itself
    const { error: shipmentDeleteError } = await locals.supabase
      .from('inbound_shipments')
      .delete()
      .eq('id', id)

    if (shipmentDeleteError) {
      console.error('Supabase delete shipment error:', shipmentDeleteError)
      throw error(500, 'Failed to delete inbound shipment')
    }

    return json({ message: 'Inbound shipment was deleted successfully' })
  } catch (err) {
    console.error('Unexpected error:', err)
    throw error(500, 'An unexpected error occurred')
  }
}
