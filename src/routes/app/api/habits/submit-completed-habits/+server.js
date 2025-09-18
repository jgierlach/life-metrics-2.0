import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
  const { completions } = await request.json()

  // Require auth
  const session = locals.session
  if (!session || !session.user?.id) {
    return json({ status: 401, body: { message: 'Unauthorized' } })
  }
  const userId = session.user.id

  if (!Array.isArray(completions) || completions.length === 0) {
    return json({ status: 400, body: { message: 'No completions provided' } })
  }

  // Validate that each habit belongs to the user and prepare rows
  /** @type {string[]} */
  const habitIds = []
  for (const c of completions) habitIds.push(c.habit_id)
  const uniqueHabitIds = Array.from(new Set(habitIds))

  const { data: userHabits, error: habitsError } = await locals.supabase
    .from('habits')
    .select('habit_id')
    .eq('user_id', userId)
    .in('habit_id', uniqueHabitIds)

  if (habitsError) {
    console.error(habitsError)
    return json({ status: 500, body: { message: 'Failed to validate habits' } })
  }

  const allowedIds = new Set()
  for (const h of userHabits ?? []) allowedIds.add(h.habit_id)
  const sanitizedRows = []
  for (const c of completions) {
    if (allowedIds.has(c.habit_id)) {
      sanitizedRows.push({
        habit_id: c.habit_id,
        date_completed: c.date_completed,
        user_id: userId,
      })
    }
  }

  if (sanitizedRows.length === 0) {
    return json({ status: 403, body: { message: 'No valid habits to record for this user' } })
  }

  const { error } = await locals.supabase.from('habit_completions').insert(sanitizedRows)

  if (error) {
    console.error(error)
    return json({ status: 500, body: { message: 'Failed to submit habit completions' } })
  }

  return json({
    status: 200,
    body: { message: 'Habit completions submitted!' },
  })
}
