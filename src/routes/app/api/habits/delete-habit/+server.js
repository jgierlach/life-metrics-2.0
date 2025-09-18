import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function DELETE(event) {
  const { request, locals } = event
  try {
    const { habitId } = await request.json()

    const userId = locals.session?.user?.id
    if (!userId) {
      return json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (!habitId) {
      return json({ message: 'habitId is required' }, { status: 400 })
    }

    const { error } = await locals.supabase
      .from('habits')
      .delete()
      .eq('habit_id', habitId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting habit:', error)
      return json({ message: 'Failed to delete habit' }, { status: 500 })
    }

    return json({
      status: 200,
      body: { message: 'Habit was deleted!' },
    })
  } catch (err) {
    console.error('Unexpected error deleting habit:', err)
    return json({ message: 'Invalid request body' }, { status: 400 })
  }
}
