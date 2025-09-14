import { redirect } from '@sveltejs/kit'

export const load = async ({ url }) => {
  const code = url.searchParams.get('code')

  if (!code) {
    return {
      status: 400,
      error: 'Invalid code',
    }
  }

  return {
    code,
  }
}

export const actions = {
  default: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData()

    const password = formData.get('password')?.toString() || ''
    const confirmPassword = formData.get('confirmPassword')?.toString() || ''

    if (password !== confirmPassword) {
      return {
        status: 400,
        message: 'Passwords do not match',
        success: false,
      }
    }

    // Reset password supabase
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      return {
        status: 400,
        message: error.message ?? 'Something went wrong',
        success: false,
      }
    }

    return redirect(303, '/app')
  },
}
