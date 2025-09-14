import { writable, get } from 'svelte/store'

export const inventoryChangelog = writable([])
export const totalChangelogCount = writable(0)
export const currentPage = writable(1)
export const pageSize = writable(50)
export const searchQuery = writable('')

/**
 * Loads paginated and sorted inventory changelog data.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export const loadInventoryChangelog = async (supabase) => {
  const currentPageValue = get(currentPage)
  const pageSizeValue = get(pageSize)
  const searchQueryValue = get(searchQuery)
  const start = (currentPageValue - 1) * pageSizeValue
  const end = start + pageSizeValue - 1

  try {
    // Base query for count
    let countQuery = supabase
      .from('inventory_changelog')
      .select('id', { count: 'exact', head: true })

    // Apply search filter if query exists - search by SKU or name
    if (searchQueryValue && searchQueryValue.trim() !== '') {
      const trimmedQuery = searchQueryValue.trim()
      countQuery = countQuery.or(`sku.ilike.%${trimmedQuery}%,name.ilike.%${trimmedQuery}%`)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Count error:', countError)
      return
    }

    totalChangelogCount.set(count || 0)

    // Fetch paginated inventory changelog
    let dataQuery = supabase.from('inventory_changelog').select('*')

    // Apply same search filter to data query
    if (searchQueryValue && searchQueryValue.trim() !== '') {
      const trimmedQuery = searchQueryValue.trim()
      dataQuery = dataQuery.or(`sku.ilike.%${trimmedQuery}%,name.ilike.%${trimmedQuery}%`)
    }

    // Order and paginate
    const { data, error } = await dataQuery
      .order('created_at', { ascending: false })
      .range(start, end)

    if (error) {
      console.error('Data fetch error:', error)
      return
    }

    inventoryChangelog.set(data)
  } catch (error) {
    console.error('Error in loadInventoryChangelog:', error)
  }
}
