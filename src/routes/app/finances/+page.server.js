import { error } from '@sveltejs/kit'
import { loadFinancialData } from '$lib/utils'

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals, depends }) {
  const { supabase } = locals
  const session = locals.session
  if (!session) {
    throw error(401, 'Unauthorized')
  }
  const userId = session.user.id

  if (!userId) {
    throw error(400, 'User id is required')
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError) {
    console.error('Supabase error fetching user:', userError?.message, userError)
    throw error(500, 'Failed to fetch user')
  }

  const creditCardsUrl = user?.credit_cards_url
  const assetsUrl = user?.assets_url
  const debtsUrl = user?.debts_url
  const taxReturnsUrl = user?.tax_returns_url
  const transactionsUrl = user?.transactions_url
  const categoriesUrl = user?.categories_url

  const creditCards = await loadFinancialData(creditCardsUrl)
  const assets = await loadFinancialData(assetsUrl)
  const debts = await loadFinancialData(debtsUrl)
  const taxReturns = await loadFinancialData(taxReturnsUrl)
  const transactions = await loadFinancialData(transactionsUrl)
  const categories = await loadFinancialData(categoriesUrl)

  return {
    creditCards,
    assets,
    debts,
    taxReturns,
    transactions,
    categories,
    session: locals.session,
  }
}
