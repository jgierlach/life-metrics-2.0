import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request, locals }) {
  const { id, name, inner_circle, phone_number, address, birthday, anniversary, notes, user_id } =
    await request.json()

  const row = {
    id,
    name,
    inner_circle,
    phone_number,
    address,
    birthday,
    anniversary,
    notes,
  }

  const { data, error } = await locals.supabase
    .from('relationships')
    .update(row)
    .eq('id', id)
    .eq('user_id', user_id)
    .select()

  if (error) {
    console.error('Error editing relationship:', error)
    return json({ message: 'Failed to edit relationship' }, { status: 500 })
  }

  return json({
    status: 200,
    body: { message: 'Relationship was edited' },
  })
}
