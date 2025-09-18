import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function PUT(event) {
  const { request, locals } = event
  try {
    const { habitId, createdAt, habitName, description = '' } = await request.json()

    const userId = locals.session?.user?.id
    if (!userId) {
      return json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (!habitId) {
      return json({ message: 'habitId is required' }, { status: 400 })
    }
    if (!habitName || typeof habitName !== 'string' || habitName.trim().length === 0) {
      return json({ message: 'habitName is required' }, { status: 400 })
    }

    const row = {
      habit_id: habitId,
      created_at: createdAt ?? undefined,
      habit_name: habitName.trim(),
      description,
    }

    const { error } = await locals.supabase
      .from('habits')
      .update(row)
      .eq('habit_id', habitId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error editing habit:', error)
      return json({ message: 'Failed to edit habit' }, { status: 500 })
    }

    return json({
      status: 200,
      body: { message: 'Habit was edited' },
    })
  } catch (err) {
    console.error('Unexpected error editing habit:', err)
    return json({ message: 'Invalid request body' }, { status: 400 })
  }
}
