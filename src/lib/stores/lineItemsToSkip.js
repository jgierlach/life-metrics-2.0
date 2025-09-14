import { writable } from 'svelte/store'

/** @type {import('svelte/store').Writable<Array<any>>} */
export const lineItemsToSkip = writable([])

/**
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns
 */
export const loadLineItemsToSkip = async (supabase) => {
  const { data, error } = await supabase
    .from('line_items_to_skip')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return
  }

  lineItemsToSkip.set(data)
}
