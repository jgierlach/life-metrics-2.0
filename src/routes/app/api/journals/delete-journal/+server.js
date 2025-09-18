import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request, locals }) {
  try {
    const { id } = await request.json()
    const userId = locals.session?.user?.id

    if (!userId) {
      return json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (!id) {
      return json({ message: 'Missing entry id' }, { status: 400 })
    }

    const { error } = await locals.supabase
      .from('journals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting journal entry', error)
      return json({ message: 'Failed to delete journal entry' }, { status: 500 })
    }

    return json({
      status: 200,
      body: { message: 'Entry was deleted!' },
    })
  } catch (err) {
    console.error('Unexpected error deleting journal entry:', err)
    return json({ message: 'Invalid request body' }, { status: 400 })
  }
}
