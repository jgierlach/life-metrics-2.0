import { json } from '@sveltejs/kit'

export async function PUT({ request, locals }) {
  const { habitId, createdAt, habitName, description } = await request.json()

  console.log('EDIT HABIT', habitId, createdAt, habitName, description)

  const userId = locals.session?.user?.id
  if (!userId) {
    return json({ message: 'Unauthorized' }, { status: 401 })
  }

  const row = {
    habit_id: habitId,
    created_at: createdAt,
    habit_name: habitName,
    description: description,
  }

  const { data, error } = await locals.supabase
    .from('habits')
    .update(row)
    .eq('habit_id', habitId)
    .eq('user_id', userId)
    .select()

  if (error) {
    console.error(error)
  }

  return json({
    status: 200,
    body: { message: 'Habit was edited' },
  })
}
