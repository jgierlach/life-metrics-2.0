import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request, locals }) {
  try {
    const {
      id,
      shipment_number,
      brand_name,
      brand_id,
      bol_number,
      carrier,
      tracking_number,
      date,
      cost_of_shipment,
      status,
      total_unit_quantity,
      total_counted_quantity,
    } = await request.json()

    if (!id) {
      return json({ message: 'Missing shipment id in request body.' }, { status: 400 })
    }

    const shipmentUpdate = {
      shipment_number,
      brand_name,
      brand_id,
      bol_number,
      carrier,
      tracking_number,
      date,
      cost_of_shipment,
      status,
      total_unit_quantity,
      total_counted_quantity,
    }

    const { data, error } = await locals.supabase
      .from('inbound_shipments')
      .update(shipmentUpdate)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase editing inbound shipment error', error)
      return json({
        status: 500,
        body: { message: 'Failed to edit inbound shipment', error },
      })
    }

    return json({
      status: 200,
      body: { message: 'Inbound shipment was edited successfully' },
    })
  } catch (err) {
    console.error('Server error editing inbound shipment', err)
    return json(
      {
        message: 'Error editing inbound shipment',
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
