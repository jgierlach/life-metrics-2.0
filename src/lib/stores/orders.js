import { writable, get } from 'svelte/store'

/** @type {import('svelte/store').Writable<any[]>} */
export const orders = writable([])
export const totalOrdersCount = writable(0)
export const currentPage = writable(1)
export const pageSize = writable(50)
export const searchQuery = writable('')
export const orderTypeFilter = writable('all') // 'all', 'hometown', '3pl'

/**
 * Loads paginated and sorted order data filtered by brand_id.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} brandId - The brand_id to filter by
 */
export const loadOrders = async (supabase, brandId) => {
  if (!brandId) {
    console.error('brandId is required for loadOrders')
    return
  }

  const currentPageValue = get(currentPage)
  const pageSizeValue = get(pageSize)
  const searchQueryValue = get(searchQuery)
  const orderTypeFilterValue = get(orderTypeFilter)
  const start = (currentPageValue - 1) * pageSizeValue
  const end = start + pageSizeValue - 1

  try {
    // Get the total count - always filter by brand_id
    let countQuery = supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brandId)

    // Apply search filter if search query exists - search across multiple fields
    if (searchQueryValue && searchQueryValue.trim() !== '') {
      const searchTerm = searchQueryValue.trim()
      countQuery = countQuery.or(
        `order_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,tracking_number.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`,
      )
    }

    // Apply order type filter
    if (orderTypeFilterValue === 'hometown') {
      countQuery = countQuery.eq('is_3pl_order', false)
    } else if (orderTypeFilterValue === '3pl') {
      countQuery = countQuery.eq('is_3pl_order', true)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Count error:', countError)
      return
    }

    totalOrdersCount.set(count || 0)

    // Fetch paginated orders - always filter by brand_id
    let dataQuery = supabase.from('orders').select('*').eq('brand_id', brandId)

    // Apply the same search filter for data - search across multiple fields
    if (searchQueryValue && searchQueryValue.trim() !== '') {
      const searchTerm = searchQueryValue.trim()
      dataQuery = dataQuery.or(
        `order_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,tracking_number.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`,
      )
    }

    // Apply order type filter
    if (orderTypeFilterValue === 'hometown') {
      dataQuery = dataQuery.eq('is_3pl_order', false)
    } else if (orderTypeFilterValue === '3pl') {
      dataQuery = dataQuery.eq('is_3pl_order', true)
    }

    const { data, error } = await dataQuery
      .order('created_at', { ascending: false })
      .range(start, end)

    if (error) {
      console.error('Data fetch error:', error)
      return
    }

    orders.set(data)
  } catch (error) {
    console.error('Error in loadOrders:', error)
  }
}
