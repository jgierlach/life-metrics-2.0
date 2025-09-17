import { json } from '@sveltejs/kit'

export async function POST({ request, locals }) {
  const { habit_name, description } = await request.json()

  const userId = locals.session?.user?.id
  if (!userId) {
    return json({ message: 'Unauthorized' }, { status: 401 })
  }

  const row = {
    habit_name,
    description,
    user_id: userId,
  }

  const { data, error } = await locals.supabase.from('habits').insert([row]).select()

  if (error) {
    console.error(error)
    return
  }

  return json({
    status: 200,
    body: { message: 'Habit created!' },
  })
}
