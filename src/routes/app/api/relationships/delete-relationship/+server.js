import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request, locals }) {
  const { id, user_id } = await request.json()

  const { error } = await locals.supabase
    .from('relationships')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id)

  if (error) {
    console.error('Error deleting journal entry:', error)
    return json({ message: 'Failed to delete journal entry' }, { status: 500 })
  }

  return json({
    status: 200,
    body: { message: 'Relationship was deleted!' },
  })
}
