import { error } from '@sveltejs/kit'

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals, depends }) {
  const { supabase } = locals
  const session = locals.session
  if (!session) {
    throw error(401, 'Unauthorized')
  }
  const userId = session.user.id

  if (!userId) {
    throw error(400, 'User id is required')
  }

  const { id } = params

  const { data: writing, error: writingError } = await supabase
    .from('writings')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (writingError) {
    console.error('Supabase error fetching writing', writingError)
    throw error(500, 'Failed to fetch writing')
  }

  return {
    writing,
    session: locals.session,
  }
}
