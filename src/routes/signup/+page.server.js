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

    // Initialize Supabase admin with service role key
    const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    try {
      // First, create Stripe customer
      const stripeResponse = await fetch('/signup/create-customer-in-stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })

      if (!stripeResponse.ok) {
        const errorData = await stripeResponse.json()
        return fail(500, {
          message: `Failed to create billing customer: ${errorData.error}`,
          data: { email, name },
          success: false,
        })
      }

      const { customerId: stripeCustomerId } = await stripeResponse.json()

      // Sign up supabase user
      // const { data, error } = await supabase.auth.signUp({
      //   email: email,
      //   password: password,
      //   options: {
      //     data: { name: name },
      //   },
      // })

      // Create the user in Supabase Auth
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (error) {
        return fail(400, {
          message: error.message ?? 'Account with email already exists',
          data: { email, name },
          success: false,
        })
      }

      // Extract user from supabase data object
      const user = data?.user

      if (!user?.id) {
        return fail(500, {
          message: 'Failed to create user account',
          data: { email, name },
          success: false,
        })
      }

      // Insert into users table with correct schema
      const { error: userInsertError } = await supabase.from('users').insert({
        id: user.id,
        email: email,
        password: password,
        name: name,
        service_role: '3pl_customer',
        has_expiration_dates: null,
        pass_on_card_fees: 'true',
        stripe_customer_id: stripeCustomerId,
      })

      if (userInsertError) {
        console.error('Error: failed to insert new user into users table', userInsertError)
        return fail(500, {
          message: userInsertError.message ?? 'Failed to create user profile.',
          data: { email, name },
          success: false,
        })
      }

      // Insert into 3pl_customers table for all new signups
      const { error: customerInsertError } = await supabase.from('3pl_customers').insert({
        user_id: user.id,
        per_order_fee: '0',
        per_order_unit_fee: '0',
        per_unit_fba_pack_prep: '0',
        per_unit_wfs_pack_prep: '0',
        per_unit_return_fee: '0',
        per_pallet_out: '0',
        per_pallet_monthly_storage_fee: '0',
        freight_percentage_markup: '0',
      })

      if (customerInsertError) {
        console.error('Error: failed to insert into 3pl_customers table', customerInsertError)
        return fail(500, {
          message: customerInsertError.message ?? 'Failed to create customer profile.',
          data: { email, name },
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
        data: { email, name },
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
