import { error } from '@sveltejs/kit'

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, depends, fetch }) {
  depends('app:journal')
  const { supabase } = locals
  const session = locals.session
  if (!session) {
    throw error(401, 'Unauthorized')
  }
  const userId = session.user.id

  if (!userId) {
    throw error(400, 'User id is required')
  }

  const { data: relationships, error: relationshipError } = await supabase
    .from('relationships')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (relationshipError) {
    throw error(500, 'Failed to fetch orderLineItems')
  }

  // Compute default dates (server-side)
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const startDate = new Date(Date.UTC(currentYear, currentMonth, 1)).toISOString().split('T')[0]
  const endDate = new Date().toISOString().split('T')[0]
  const selectedDate = new Date().toISOString().split('T')[0]

  // Fetch interactions count and interactions-by-day in parallel (server-side)
  const startUTC = new Date(`${startDate}T00:00:00`).toISOString()
  const endUTC = new Date(`${endDate}T23:59:59`).toISOString()
  const [countRes, byDayRes] = await Promise.all([
    supabase
      .from('relationship_interactions')
      .select(
        'relationship_name, interaction_type, relationship_id, created_at, date_of_interaction',
      )
      .eq('user_id', userId)
      .gte('date_of_interaction', startUTC)
      .lte('date_of_interaction', endUTC),
    supabase
      .from('relationship_interactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date_of_interaction', `${selectedDate}T00:00:00`)
      .lte('date_of_interaction', `${selectedDate}T23:59:59`),
  ])

  const countData = countRes.data || []
  const relationshipInteractionsByDay = byDayRes.data || []

  /** @type {Record<string, { name: string, total_texts: number, total_calls: number, total_in_person: number, total_interactions_count: number }>} */
  const interactionSummary = (countData || []).reduce((summary, interaction) => {
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
  }, /** @type {any} */ ({}))
  const relationshipInteractionsCount = Object.values(interactionSummary)

  return {
    relationships,
    session: locals.session,
    relationshipInteractionsCount,
    relationshipInteractionsByDay,
    startDate,
    endDate,
    selectedDate,
  }
}
