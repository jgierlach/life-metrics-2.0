import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request, locals }) {
  try {
    const userId = locals.session?.user?.id
    if (!userId) {
      return json({ message: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await request.json()

    if (!id) {
      return json({ message: 'id is required' }, { status: 400 })
    }

    const { error } = await locals.supabase
      .from('relationships')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting relationship:', error)
      return json({ message: 'Failed to delete relationship' }, { status: 500 })
    }

    return json({
      status: 200,
      body: { message: 'Relationship was deleted!' },
    })
  } catch (err) {
    console.error('Unexpected error deleting relationship:', err)
    return json({ message: 'Invalid request body' }, { status: 400 })
  }
}
