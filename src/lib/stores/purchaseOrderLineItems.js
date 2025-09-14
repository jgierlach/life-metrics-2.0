import { writable } from 'svelte/store'

export const purchaseOrderLineItems = writable([])

/**
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns
 */
export const loadPurchaseOrderLineItems = async (supabase) => {
  const { data, error } = await supabase
    .from('purchase_order_line_items')
    .select('*')
    .order('date_placed', { ascending: false })

  if (error) {
    console.error(error)
    return
  }

  purchaseOrderLineItems.set(data)
}
