import { error } from '@sveltejs/kit'

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals }) {
  const { orderId } = params
  const { supabase, session } = locals

  if (!orderId) {
    throw error(400, 'Order id is required')
  }

  // Get user's billing information from 3pl_customers
  const { data: billingInfo, error: billingError } = await supabase
    .from('3pl_customers')
    .select('*')
    .eq('user_id', session?.user?.id)
    .single()

  if (billingError) {
    // PGRST116 = no rows found
    console.error('Failed to fetch billing info:', billingError)
  }

  // Get all order line items for this order
  const { data: orderLineItems, error: orderLineItemsError } = await supabase
    .from('order_line_items')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at')

  if (orderLineItemsError) {
    throw error(500, 'Failed to fetch orderLineItems')
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)

  if (orderError) {
    throw error(500, 'Failed to fetch order')
  }

  return {
    order: order[0],
    orderLineItems,
    billingInfo: billingInfo,
    session: locals.session,
  }
}
