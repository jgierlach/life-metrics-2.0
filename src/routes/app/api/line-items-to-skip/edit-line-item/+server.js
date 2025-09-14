import { json } from '@sveltejs/kit'

export async function PUT({ request, locals }) {
  try {
    const { id, brand_name, brand_id, name } = await request.json()

    const lineItem = {
      brand_name,
      brand_id,
      name,
    }

    const { data, error } = await locals.supabase
      .from('line_items_to_skip')
      .update(lineItem)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase editing lineItem error', error)
      return json({
        status: 500,
        body: { message: 'Failed to edit lineItem', error },
      })
    }

    return json({
      status: 200,
      body: { message: 'lineItem was edited' },
    })
  } catch (err) {
    console.error('Server error editing lineItem ', err)
    return json({ message: 'Error editing lineItem', error: err?.message }, { status: 500 })
  }
}
