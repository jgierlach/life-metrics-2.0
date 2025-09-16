import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request, locals }) {
  const { id, user_id } = await request.json()

  if (!id || !user_id) {
    return json(
      { message: 'Missing or invalid fields required to delete journal entry.' },
      { status: 400 },
    )
  }

  const { error } = await locals.supabase
    .from('journal')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id)

  if (error) {
    console.error('Error deleting journal entry', error)
    return json({ message: 'Failed to delete journal entry' }, { status: 500 })
  }

  return json({
    status: 200,
    body: { message: 'Entry was deleted!' },
  })
}
