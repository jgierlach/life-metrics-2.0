import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
  try {
    const userId = locals.session?.user?.id
    if (!userId) {
      return json({ message: 'Unauthorized' }, { status: 401 })
    }
    // Get today's start and end date
    const today = new Date()
    const startDate = today.toISOString().split('T')[0] // Format YYYY-MM-DD
    const endDate = `${startDate}T23:59:59` // Include the whole day

    // Query to get interactions within the specified date range
    const { data, error } = await locals.supabase
      .from('relationship_interactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date_of_interaction', `${startDate}T00:00:00`)
      .lte('date_of_interaction', endDate)

    // Handle error from Supabase
    if (error) {
      console.error('Error fetching interactions:', error)
      return json({ message: 'Error fetching interactions' }, { status: 500 })
    }

    return json(data ?? [], { status: 200 })
  } catch (err) {
    console.error("Unexpected error fetching today's interactions:", err)
    return json({ message: 'Invalid request' }, { status: 400 })
  }
}
