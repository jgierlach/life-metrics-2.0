import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, locals }) {
  const startDate = url.searchParams.get('startDate')
  let endDate = url.searchParams.get('endDate')

  if (!startDate || !endDate) {
    return json({
      status: 400,
      body: { message: 'Invalid date range' },
    })
  }

  // Convert dates to UTC
  const startUTC = new Date(`${startDate}T00:00:00`).toISOString()
  const endUTC = new Date(`${endDate}T23:59:59`).toISOString()

  // Query to get interactions within the specified date range
  const { data, error } = await locals.supabase
    .from('relationship_interactions')
    .select('relationship_name, interaction_type, relationship_id, created_at, date_of_interaction')
    .gte('date_of_interaction', startUTC)
    .lte('date_of_interaction', endUTC)

  if (error) {
    return json({
      status: 500,
      body: { message: 'Error fetching interactions', error },
    })
  }

  if (data.length === 0) {
    console.log('No interactions found for the specified date range.')
  }

  // Group data by relationship and count interaction types
  /**
   * @typedef {Object} InteractionSummaryItem
   * @property {string} name
   * @property {number} total_texts
   * @property {number} total_calls
   * @property {number} total_in_person
   * @property {number} total_interactions_count
   */
  /** @type {Record<string, InteractionSummaryItem>} */
  const interactionSummary = data.reduce((summary, interaction) => {
    const { relationship_name, interaction_type, relationship_id } = interaction

    if (!summary[relationship_id]) {
      summary[relationship_id] = {
        name: relationship_name,
        total_texts: 0,
        total_calls: 0,
        total_in_person: 0,
        total_interactions_count: 0,
      }
    }

    // Increment interaction type counts
    if (interaction_type === 'Text') {
      summary[relationship_id].total_texts += 1
      summary[relationship_id].total_interactions_count += 1
    } else if (interaction_type === 'Call') {
      summary[relationship_id].total_calls += 1
      summary[relationship_id].total_interactions_count += 1
    } else if (interaction_type === 'In Person') {
      summary[relationship_id].total_in_person += 1
      summary[relationship_id].total_interactions_count += 1
    }

    return summary
  }, /** @type {Record<string, InteractionSummaryItem>} */ ({}))

  // Convert the summary object into an array of results
  const results = Object.values(interactionSummary)

  return json({
    status: 200,
    body: results,
  })
}
