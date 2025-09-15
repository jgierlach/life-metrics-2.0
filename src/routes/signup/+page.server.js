import { fail } from '@sveltejs/kit'
import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'

/** @type {import('./$types').Actions} */
export const actions = {
  signup: async ({ request, locals: { supabase }, fetch }) => {
    const formData = await request.formData()

    const email = formData.get('email')?.toString() || ''
    const password = formData.get('password')?.toString() || ''
    const name = formData.get('name')?.toString() || ''
    const phoneNumberRaw = formData.get('phoneNumber')?.toString() || ''

    // Normalize to a simple E.164-like string. This is a lightweight heuristic,
    // not a full libphonenumber implementation.
    /** @param {string} input */
    const normalizePhone = (input) => {
      if (!input) return ''
      let digitsOnly = input.replace(/\D/g, '')
      if (digitsOnly.length === 0) return ''
      if (digitsOnly.length === 10) {
        return `+1${digitsOnly}`
      }
      if (digitsOnly.length >= 11 && digitsOnly.length <= 15) {
        return `+${digitsOnly}`
      }
      return ''
    }

    const normalizedPhone = normalizePhone(phoneNumberRaw)
    if (!normalizedPhone) {
      return fail(400, {
        message: 'Please enter a valid phone number',
        data: { email, name, phoneNumber: phoneNumberRaw },
        success: false,
      })
    }

    // Initialize Supabase admin with service role key
    const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    try {
      // Create the user in Supabase Auth
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (error) {
        return fail(400, {
          message: error.message ?? 'Account with email already exists',
          data: { email, name, phoneNumber: phoneNumberRaw },
          success: false,
        })
      }

      // Extract user from supabase data object
      const user = data?.user

      if (!user?.id) {
        return fail(500, {
          message: 'Failed to create user account',
          data: { email, name, phoneNumber: phoneNumberRaw },
          success: false,
        })
      }

      // Insert into users table with correct schema
      const { error: userInsertError } = await supabase.from('users').insert({
        id: user.id,
        email: email,
        password: password,
        name: name,
        phone_number: normalizedPhone,
      })

      if (userInsertError) {
        console.error('Error: failed to insert new user into users table', userInsertError)
        return fail(500, {
          message: userInsertError.message ?? 'Failed to create user profile.',
          data: { email, name, phoneNumber: phoneNumberRaw },
          success: false,
        })
      }

      return {
        showConfirmation: true,
        data: { email, name: '' },
      }
    } catch (error) {
      console.error('Error during signup process:', error)
      return fail(500, {
        message: 'An unexpected error occurred during signup',
        data: { email, name, phoneNumber: phoneNumberRaw },
        success: false,
      })
    }
  },

  resendConfirmation: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData()
    const email = formData.get('email')?.toString() || ''

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })

    if (error) {
      return fail(400, {
        message: error.message ?? 'Invalid email, try again',
        email,
        success: false,
        showConfirmation: true,
      })
    }

    return {
      showConfirmation: true,
      data: { email, name: '' },
    }
  },
}
