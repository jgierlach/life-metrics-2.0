import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, locals }) {
  const selectedDate = url.searchParams.get('selectedDate')

  console.log('SELECTED DATE ON SERVER', selectedDate)

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
    .gte('date_of_interaction', startUTC)
    .lte('date_of_interaction', endUTC)

  if (error) {
    return json({
      status: 500,
      body: { message: 'Error fetching interactions by day.', error },
    })
  }

  if (data.length === 0) {
    console.log('No interactions found for the specified day.')
  }

  console.log('interactions by day on server', data)

  return json({
    status: 200,
    body: data,
  })
}
