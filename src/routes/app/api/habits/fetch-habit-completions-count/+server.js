import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, locals }) {
  try {
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    if (!startDate || !endDate) {
      return json({
        status: 400,
        body: { message: 'Missing startDate or endDate parameter' },
      })
    }

    // Ensure user scoping (multi-tenancy)
    const session = locals.session
    if (!session || !session.user?.id) {
      return json({ status: 401, body: { message: 'Unauthorized' } })
    }
    const userId = session.user.id

    // 1) Fetch the user's habits to get ids and names
    const { data: userHabits, error: habitsError } = await locals.supabase
      .from('habits')
      .select('habit_id, habit_name')
      .eq('user_id', userId)

    if (habitsError) {
      console.error(habitsError)
      return json({ status: 500, body: { message: 'Failed to fetch habits' } })
    }

    if (!userHabits || userHabits.length === 0) {
      return json({ status: 200, body: [] })
    }

    /** @type {string[]} */
    const habitIds = []
    for (const habit of userHabits) {
      habitIds.push(habit.habit_id)
    }

    // 2) Fetch completions for those habits in the date range
    const { data: completions, error: completionsError } = await locals.supabase
      .from('habit_completions')
      .select('habit_id, date_completed')
      .in('habit_id', habitIds)
      .gte('date_completed', startDate)
      .lte('date_completed', endDate)

    if (completionsError) {
      console.error(completionsError)
      return json({ status: 500, body: { message: 'Failed to fetch completions' } })
    }

    // 3) Aggregate counts per habit_id and map to habit_name
    /** @type {Map<string, string>} */
    const idToName = new Map()
    for (const habit of userHabits) {
      idToName.set(habit.habit_id, habit.habit_name)
    }
    const countsMap = new Map()

    for (const row of completions ?? []) {
      const name = idToName.get(row.habit_id)
      if (!name) continue
      countsMap.set(name, (countsMap.get(name) ?? 0) + 1)
    }

    const result = Array.from(countsMap.entries()).map(([habit_name, count]) => ({
      habit_name,
      count,
    }))

    return json({ status: 200, body: result })
  } catch (err) {
    console.error('Unexpected error fetching habit completions count:', err)
    return json({ status: 400, body: { message: 'Invalid request' } })
  }
}
