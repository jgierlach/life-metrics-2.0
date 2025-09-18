import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, locals }) {
  try {
    const selectedDate = url.searchParams.get('selectedDate')
    const userId = locals.session?.user?.id
    if (!userId) {
      return json({ status: 401, body: { message: 'Unauthorized' } })
    }

    if (!selectedDate) {
      return json({
        status: 400,
        body: { message: 'Invalid date range' },
      })
    }

    // Convert dates to UTC
    const startUTC = new Date(`${selectedDate}T00:00:00`).toISOString()
    const endUTC = new Date(`${selectedDate}T23:59:59`).toISOString()

    // Query to get interactions within the specified date range
    const { data, error } = await locals.supabase
      .from('relationship_interactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date_of_interaction', startUTC)
      .lte('date_of_interaction', endUTC)

    if (error) {
      return json({
        status: 500,
        body: { message: 'Error fetching interactions by day.' },
      })
    }

    return json({
      status: 200,
      body: data ?? [],
    })
  } catch (err) {
    console.error('Unexpected error fetching interactions by day:', err)
    return json({ status: 400, body: { message: 'Invalid request' } })
  }
}
