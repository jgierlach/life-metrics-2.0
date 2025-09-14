import { writable } from 'svelte/store'

export const users = writable([])

/**
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns
 */
export const loadUsers = async (supabase) => {
  const { data, error } = await supabase.from('users').select('*')

  if (error) {
    console.error(error)
    return
  }

  users.set(data)
}
