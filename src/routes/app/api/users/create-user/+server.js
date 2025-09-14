import { json } from '@sveltejs/kit'
import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'
import Stripe from 'stripe'
import { STRIPE_PRIVATE_KEY } from '$env/static/private'
const stripe = new Stripe(STRIPE_PRIVATE_KEY)

export async function POST({ request }) {
  // Parse the incoming request to get the user data
  const { email, password, name, service_role, pass_on_card_fees } = await request.json()

  // Initialize stripe customer id in case user is a distribution partner or 3pl customer
  let stripe_customer_id = null

  // Initialize Supabase client with service role key
  const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      console.error('Error creating user in auth:', authError)
      throw new Error('Failed to create user in auth.')
    }

    // Create a stripe customer if user is a distribution partner or 3pl customer
    if (service_role === 'distribution_partner' || service_role === '3pl_customer') {
      const stripeCustomer = await stripe.customers.create({
        name,
        email,
      })
      stripe_customer_id = stripeCustomer.id
    }

    // Insert the user into your custom `users` table
    const { error: userError } = await supabaseAdmin.from('users').insert([
      {
        id: authData.user.id, // Use the ID from the auth table
        name,
        email,
        password,
        service_role,
        pass_on_card_fees,
        stripe_customer_id,
      },
    ])

    if (userError) {
      console.error('Error inserting user into users table:', userError)
      throw new Error('Failed to insert user into users table.')
    }

    // If the user is a 3pl customer insert into 3pl_customers table
    if (service_role === '3pl_customer') {
      const { error: threePlCustomerError } = await supabaseAdmin.from('3pl_customers').insert([
        {
          user_id: authData.user.id,
          per_order_fee: 0.0,
          per_order_unit_fee: 0.0,
          per_unit_fba_pack_prep: 0.0,
          per_unit_wfs_pack_prep: 0.0,
          per_unit_return_fee: 0.0,
          per_pallet_out: 0.0,
          per_pallet_monthly_storage_fee: 0.0,
        },
      ])
      if (threePlCustomerError) {
        console.error(
          'Error inserting 3pl customer into 3pl_customers table:',
          threePlCustomerError,
        )
        throw new Error('Failed to insert 3pl customer into 3pl_customers table.')
      }
    }

    // Return a successful response
    return json({
      status: 201,
      body: { message: 'User created successfully!' },
    })
  } catch (error) {
    console.error('Error during user creation:', error)
    return json({
      status: 500,
      body: { message: error.message },
    })
  }
}
