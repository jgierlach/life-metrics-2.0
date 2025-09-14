import { fail, redirect } from '@sveltejs/kit'
import { env } from '$env/dynamic/public'

/** @type {import('./$types').Actions} */
export const actions = {
  default: async (event) => {
    const formData = await event.request.formData()

    const method = formData.get('method')?.toString() || 'password'
    const email = formData.get('email')?.toString().trim() || ''
    const password = formData.get('password')?.toString().trim() || ''

    if (method === 'magic') {
      if (!email) {
        return fail(400, {
          message: 'Please enter your email',
          email,
          success: false,
        })
      }

      let siteUrl = event.url.origin
      const configuredSiteUrl = env.PUBLIC_SITE_URL
      if (configuredSiteUrl) {
        try {
          const configured = new URL(configuredSiteUrl)
          if (configured.host === event.url.host) {
            siteUrl = configured.origin
          }
        } catch (_) {}
      }

      const emailRedirectTo = new URL('/auth/callback', siteUrl).toString()

      const { error } = await event.locals.supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo },
      })

      if (error) {
        console.error('MAGIC LINK ERROR', error)
        return fail(400, {
          message: error.message ?? 'Unable to send magic link',
          email,
          success: false,
        })
      }

      return {
        message: 'Magic link sent! Check your email to continue.',
        email,
        success: true,
      }
    }

    const { error } = await event.locals.supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('LOGIN ERROR', error)
      return fail(400, {
        message: error.message ?? 'Invalid email or password',
        email,
        success: false,
      })
    }

    throw redirect(303, '/app')
  },
}
