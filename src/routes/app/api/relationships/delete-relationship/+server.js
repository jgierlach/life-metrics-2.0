import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request, locals }) {
  const userId = locals.session?.user?.id
  if (!userId) {
    return json({ message: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await request.json()

  const { error } = await locals.supabase
    .from('relationships')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting journal entry:', error)
    return json({ message: 'Failed to delete journal entry' }, { status: 500 })
  }

  return json({
    status: 200,
    body: { message: 'Relationship was deleted!' },
  })
}
