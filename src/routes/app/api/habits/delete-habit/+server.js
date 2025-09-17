import { json } from '@sveltejs/kit'

export async function DELETE({ request, locals }) {
  const { habitId } = await request.json()

  const userId = locals.session?.user?.id
  if (!userId) {
    return json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await locals.supabase
    .from('habits')
    .delete()
    .eq('habit_id', habitId)
    .eq('user_id', userId)

  if (error) {
    console.error(error)
  }

  return json({
    status: 200,
    body: { message: 'Habit was deleted!' },
  })
}
