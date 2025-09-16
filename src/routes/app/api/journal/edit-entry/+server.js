import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request, locals }) {
  const { id, content, user_id } = await request.json()

  if (!id || !user_id || !content) {
    return json(
      { message: 'Missing or invalid fields required to edit journal entry.' },
      { status: 400 },
    )
  }

  const row = {
    content,
  }

  const { data, error } = await locals.supabase
    .from('journal')
    .update(row)
    .eq('id', id)
    .eq('user_id', user_id)
    .select()

  if (error) {
    console.error('Error editing journal entry', error)
    return json({ message: 'Failed to edit journal entry' }, { status: 500 })
  }

  return json({
    status: 200,
    body: { message: 'Journal was edited' },
  })
}
