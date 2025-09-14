import { json } from '@sveltejs/kit'

export async function POST({ request, locals }) {
  try {
    const { brand_id, brand_name, name } = await request.json()

    const lineItem = {
      brand_id,
      brand_name,
      name,
    }

    const { data, error } = await locals.supabase
      .from('line_items_to_skip')
      .insert([lineItem])
      .select()

    if (error) {
      console.error('Supabase Insert Error:', error)
      return json({ message: 'lineItem creation failed.', error: error.message }, { status: 500 })
    }

    return json({ message: 'New lineItem was created!', data }, { status: 201 })
  } catch (err) {
    console.error('Server Error:', err)
    return json({ message: 'Internal server error.' }, { status: 500 })
  }
}
