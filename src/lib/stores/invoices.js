import { writable } from 'svelte/store'

export const invoices = writable(/** @type {any[]} */ ([]))

/**
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} brandId
 * @returns
 */
export const loadInvoices = async (supabase, brandId) => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return
  }

  invoices.set(data)
}
