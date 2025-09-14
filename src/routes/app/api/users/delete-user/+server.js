import { json } from '@sveltejs/kit'
import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'

export async function DELETE({ request }) {
  const { id } = await request.json()

  // Initialize Supabase client with service role key
  const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Delete the user from the Supabase auth table
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)

  if (authError) {
    console.error('Error deleting user from auth:', authError)
    return json({ status: 500, body: { message: 'Failed to delete user from auth.' } })
  }

  // Then, delete the user from the users table
  const { error: userError } = await supabaseAdmin.from('users').delete().eq('id', id)

  if (userError) {
    console.error('Error deleting user from users table:', userError)
    return json({ status: 500, body: { message: 'Failed to delete user from users table.' } })
  }

  return json({
    status: 200,
    body: { message: 'User was deleted!' },
  })
}
