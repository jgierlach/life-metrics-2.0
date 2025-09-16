import { error } from '@sveltejs/kit'

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals, depends }) {
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

  return {
    relationships,
    session: locals.session,
  }
}
