import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request, locals }) {
  try {
    const {
      id,
      brand_name,
      brand_id,
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
      total_cost_of_good,
      notes,
      is_3pl_order,
    } = await request.json()

    const orderUpdate = {
      brand_name,
      brand_id,
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
      total_cost_of_good,
      notes,
      is_3pl_order,
    }

    const { data, error } = await locals.supabase
      .from('orders')
      .update(orderUpdate)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase editing order error', error)
      return json({
        status: 500,
        body: { message: 'Failed to edit order', error },
      })
    }

    return json({
      status: 200,
      body: { message: 'Order was edited successfully' },
    })
  } catch (err) {
    console.error('Server error editing order', err)
    return json(
      {
        message: 'Error editing order',
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
