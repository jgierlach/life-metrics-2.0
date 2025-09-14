// supabase reset password sveltekit action

import { fail } from '@sveltejs/kit'

export const actions = {
  default: async ({ request, locals: { supabase }, url }) => {
    const formData = await request.formData()

    const email = formData.get('email')?.toString() || ''

    const hostName = url.host || 'http://localhost:5173'

    // Reset password supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${hostName}/set-new-password`,
    })

    if (error) {
      return fail(400, {
        message: error.message ?? 'Invalid email',
        success: false,
      })
    }

    return {
      success: true,
    }
  },
}
