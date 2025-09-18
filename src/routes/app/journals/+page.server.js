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

  const { data: journalRows, error: journalError } = await supabase
    .from('journals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (journalError) {
    throw error(500, 'Failed to fetch journal entries')
  }

  // Pinned first (is_pinned === true), then all others by created_at (already sorted)
  const pinned = (journalRows || []).filter((j) => j.is_pinned === true)
  const others = (journalRows || []).filter((j) => j.is_pinned !== true)

  return {
    journals: [...pinned, ...others],
    session: locals.session,
  }
}
