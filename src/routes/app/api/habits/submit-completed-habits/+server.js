import { json } from '@sveltejs/kit'

export async function POST({ request, locals }) {
  const { completions } = await request.json()

  const rows = completions

  const { data, error } = await locals.supabase.from('habit_completions').insert(rows).select()

  if (error) {
    console.error(error)
    return
  }

  return json({
    status: 200,
    body: { message: 'Habit completions submitted!' },
  })
}
