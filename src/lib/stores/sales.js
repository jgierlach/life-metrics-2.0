import { writable, get } from 'svelte/store'

/** @type {import('svelte/store').Writable<any[]>} */
export const sales = writable([])
export const totalSalesCount = writable(0)
export const currentPage = writable(1)
export const pageSize = writable(50)
export const searchQuery = writable('')

/**
 * Loads paginated and sorted product data.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export const loadSales = async (supabase) => {
  const currentPageValue = get(currentPage)
  const pageSizeValue = get(pageSize)
  const searchQueryValue = get(searchQuery)
  const start = (currentPageValue - 1) * pageSizeValue
  const end = start + pageSizeValue - 1

  try {
    // Get the total count
    let countQuery = supabase.from('sales').select('id', { count: 'exact', head: true })

    // Apply filter if search query exists
    if (searchQueryValue && searchQueryValue.trim() !== '') {
      // Use eq for exact match
      // countQuery = countQuery.eq('order_number', searchQueryValue.trim())

      // Or use textSearch for partial match if supported
      // countQuery = countQuery.textSearch('order_number', searchQueryValue.trim())

      // Or use the contains operator for case-sensitive partial match
      countQuery = countQuery.filter('order_number', 'ilike', `%${searchQueryValue.trim()}%`)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Count error:', countError)
      return
    }

    totalSalesCount.set(count || 0)

    // Fetch paginated sales
    let dataQuery = supabase.from('sales').select('*')

    // Apply the same filter for data
    if (searchQueryValue && searchQueryValue.trim() !== '') {
      dataQuery = dataQuery.filter('order_number', 'ilike', `%${searchQueryValue.trim()}%`)
    }

    const { data, error } = await dataQuery
      .order('order_date', { ascending: false })
      .range(start, end)

    if (error) {
      console.error('Data fetch error:', error)
      return
    }

    sales.set(data)
  } catch (error) {
    console.error('Error in loadSales:', error)
  }
}
