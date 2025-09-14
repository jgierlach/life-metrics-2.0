import { writable } from 'svelte/store'

export const unmappedSkus = writable(/** @type {any[]} */ ([]))

/**
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns
 */
export const loadUnmappedSkus = async (supabase) => {
  const { data, error } = await supabase
    .from('unmapped_skus')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return
  }

  unmappedSkus.set(data)
}
