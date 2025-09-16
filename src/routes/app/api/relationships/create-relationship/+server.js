import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
  const { name, inner_circle, phone_number, address, birthday, anniversary, notes, user_id } =
    await request.json()

  const row = {
    name,
    inner_circle,
    phone_number,
    address,
    birthday,
    anniversary,
    date_of_last_text: null,
    date_of_last_phone_call: null,
    date_of_last_in_person: null,
    notes,
    user_id,
  }

  const { data, error } = await locals.supabase.from('relationships').insert([row]).select()

  if (error) {
    console.error('Error creating relationship:', error)
    return json({ message: 'Failed to create relationship' }, { status: 500 })
  }

  return json({
    status: 200,
    body: { message: 'Relationship was created!' },
  })
}
