import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request, locals }) {
  const userId = locals.session?.user?.id
  if (!userId) {
    return json({ message: 'Unauthorized' }, { status: 401 })
  }
  const { id, name, inner_circle, phone_number, address, birthday, anniversary, notes } =
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
    .eq('user_id', userId)
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
