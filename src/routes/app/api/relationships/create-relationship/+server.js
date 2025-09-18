import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
  try {
    const userId = locals.session?.user?.id
    if (!userId) {
      return json({ message: 'Unauthorized' }, { status: 401 })
    }
    const { name, inner_circle, phone_number, address, birthday, anniversary, notes } =
      await request.json()

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return json({ message: 'name is required' }, { status: 400 })
    }

    const row = {
      name: name.trim(),
      inner_circle,
      phone_number,
      address,
      birthday,
      anniversary,
      date_of_last_text: null,
      date_of_last_phone_call: null,
      date_of_last_in_person: null,
      notes,
      user_id: userId,
    }

    const { error } = await locals.supabase.from('relationships').insert([row])

    if (error) {
      console.error('Error creating relationship:', error)
      return json({ message: 'Failed to create relationship' }, { status: 500 })
    }

    return json({
      status: 200,
      body: { message: 'Relationship was created!' },
    })
  } catch (err) {
    console.error('Unexpected error creating relationship:', err)
    return json({ message: 'Invalid request body' }, { status: 400 })
  }
}
