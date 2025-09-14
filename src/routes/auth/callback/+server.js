import { redirect } from '@sveltejs/kit'

/**
 * Handles Supabase email magic-link callback by exchanging the code for a session
 * and redirecting the user to the appropriate destination.
 *
 * @type {import('./$types').RequestHandler}
 */
export const GET = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get('code')
  const errorDescription = url.searchParams.get('error_description')
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')

  if (errorDescription) {
    const message = encodeURIComponent(errorDescription)
    throw redirect(303, `/login?message=${message}`)
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      const message = encodeURIComponent(error.message ?? 'Authentication failed')
      throw redirect(303, `/login?message=${message}`)
    }
    throw redirect(303, '/app')
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (error) {
      const message = encodeURIComponent(error.message ?? 'Authentication failed')
      throw redirect(303, `/login?message=${message}`)
    }
    throw redirect(303, '/app')
  }

  const message = encodeURIComponent('Invalid or expired login link')
  throw redirect(303, `/login?message=${message}`)
}
