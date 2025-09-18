import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function POST(event) {
  const { request, locals } = event
  try {
    const { habit_name, description = '' } = await request.json()

    const userId = locals.session?.user?.id
    if (!userId) {
      return json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (!habit_name || typeof habit_name !== 'string' || habit_name.trim().length === 0) {
      return json({ message: 'habit_name is required' }, { status: 400 })
    }

    const row = {
      habit_name: habit_name.trim(),
      description,
      user_id: userId,
    }

    const { error } = await locals.supabase.from('habits').insert([row])

    if (error) {
      console.error('Error creating habit:', error)
      return json({ message: 'Failed to create habit' }, { status: 500 })
    }

    return json({
      status: 200,
      body: { message: 'Habit created!' },
    })
  } catch (err) {
    console.error('Unexpected error creating habit:', err)
    return json({ message: 'Invalid request body' }, { status: 400 })
  }
}
