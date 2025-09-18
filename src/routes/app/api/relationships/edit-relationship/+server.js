import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request, locals }) {
  try {
    const userId = locals.session?.user?.id
    if (!userId) {
      return json({ message: 'Unauthorized' }, { status: 401 })
    }
    const { id, name, inner_circle, phone_number, address, birthday, anniversary, notes } =
      await request.json()

    if (!id) {
      return json({ message: 'id is required' }, { status: 400 })
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return json({ message: 'name is required' }, { status: 400 })
    }

    const row = {
      id,
      name: name.trim(),
      inner_circle,
      phone_number,
      address,
      birthday,
      anniversary,
      notes,
    }

    const { error } = await locals.supabase
      .from('relationships')
      .update(row)
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error editing relationship:', error)
      return json({ message: 'Failed to edit relationship' }, { status: 500 })
    }

    return json({
      status: 200,
      body: { message: 'Relationship was edited' },
    })
  } catch (err) {
    console.error('Unexpected error editing relationship:', err)
    return json({ message: 'Invalid request body' }, { status: 400 })
  }
}
