import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
  const { content, user_id } = await request.json()

  if (!content || !user_id) {
    return json(
      { message: 'Missing or invalid fields required to create journal entry.' },
      { status: 400 },
    )
  }

  const row = {
    content,
    user_id,
  }

  const { data, error } = await locals.supabase.from('journal').insert([row]).select()

  if (error) {
    console.error('Error creating journal entry', error)
    return json({ message: 'Failed to create journal entry' }, { status: 500 })
  }

  return json({
    status: 200,
    body: { message: 'Entry created!' },
  })
}
