import { json } from '@sveltejs/kit'

export async function POST({ request, locals }) {
  try {
    const { purchaseOrderLineItems } = await request.json()

    // Input validation
    if (!purchaseOrderLineItems) {
      return json({ message: 'Missing required field purchaseOrderLineItems.' }, { status: 400 })
    }

    // Insert data
    const { data, error } = await locals.supabase
      .from('purchase_order_line_items')
      .insert(purchaseOrderLineItems)
      .select()

    // Handle Supabase errors
    if (error) {
      console.error('Supabase Insert Error:', error)
      return json(
        { message: 'Purchase order creation failed.', error: error.message },
        { status: 500 },
      )
    }

    return json({ message: 'Purchase order was created!', data }, { status: 201 })
  } catch (err) {
    console.error('Server Error:', err)
    return json({ message: 'Internal server error.' }, { status: 500 })
  }
}
