import { json } from '@sveltejs/kit'
import Stripe from 'stripe'
import { STRIPE_PRIVATE_KEY } from '$env/static/private'

const stripe = new Stripe(STRIPE_PRIVATE_KEY)

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { name, email } = await request.json()

    if (!name || !email) {
      return json({ error: 'Name and email are required.' }, { status: 400 })
    }

    const customer = await stripe.customers.create({
      name,
      email,
    })

    console.log('CUSTOMER ID', customer.id)

    return json({ customerId: customer.id })
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    return json({ error: 'Failed to create customer.' }, { status: 500 })
  }
}
