import { json } from '@sveltejs/kit'
import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'

/** @type {import('./$types').RequestHandler} */
export async function POST({ locals }) {
  try {
    const userId = locals.session?.user?.id
    if (!userId) {
      return json({ message: 'Unauthorized' }, { status: 401 })
    }

    const admin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId)
    if (deleteAuthError) {
      console.error('Failed to delete auth user', deleteAuthError)
      return json({ message: 'Failed to delete account' }, { status: 500 })
    }

    // Best-effort cleanup of profile row
    const { error: deleteUserRowError } = await locals.supabase
      .from('users')
      .delete()
      .eq('id', userId)
    if (deleteUserRowError) {
      console.warn('Failed to delete users row (continuing):', deleteUserRowError)
    }

    return json({ message: 'Account deleted' }, { status: 200 })
  } catch (err) {
    console.error('Unexpected error deleting account:', err)
    return json({ message: 'Failed to delete account' }, { status: 500 })
  }
}
