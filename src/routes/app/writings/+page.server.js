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

  const { data: writingRows, error: writingError } = await supabase
    .from('writings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (writingError) {
    throw error(500, 'Failed to fetch writing')
  }

  return {
    writings: writingRows,
    session: locals.session,
  }
}
