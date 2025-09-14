import { writable, get } from 'svelte/store'

export const brandSkuMapping = writable([])
export const totalSkuCount = writable(0)
export const currentPage = writable(1)
export const pageSize = writable(50)
export const searchQuery = writable('')
export const brandFilter = writable('All Brands')

/**
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns
 */
export const loadBrandSkuMapping = async (supabase) => {
  const currentPageValue = get(currentPage)
  const pageSizeValue = get(pageSize)
  const searchQueryValue = get(searchQuery)
  const brandFilterValue = get(brandFilter)
  const start = (currentPageValue - 1) * pageSizeValue
  const end = start + pageSizeValue - 1

  // First get the total count
  let countQuery = supabase.from('brand_sku_mapping').select('*', { count: 'exact', head: true })

  // Apply search filter if query exists - search by SKU, ASIN, or name
  if (searchQueryValue && searchQueryValue.trim() !== '') {
    const trimmedQuery = searchQueryValue.trim()
    countQuery = countQuery.or(
      `sku.ilike.%${trimmedQuery}%,asin.ilike.%${trimmedQuery}%,name.ilike.%${trimmedQuery}%`,
    )
  }

  // Apply brand filter if not "All Brands"
  if (brandFilterValue && brandFilterValue !== 'All Brands') {
    countQuery = countQuery.eq('brand_name', brandFilterValue)
  }

  const { count, error: countError } = await countQuery

  if (countError) {
    console.error(countError)
    return
  }

  totalSkuCount.set(count || 0)

  // Then get the paginated data
  let dataQuery = supabase.from('brand_sku_mapping').select('*')

  // Apply same search filter to data query
  if (searchQueryValue && searchQueryValue.trim() !== '') {
    const trimmedQuery = searchQueryValue.trim()
    dataQuery = dataQuery.or(
      `sku.ilike.%${trimmedQuery}%,asin.ilike.%${trimmedQuery}%,name.ilike.%${trimmedQuery}%`,
    )
  }

  // Apply brand filter if not "All Brands"
  if (brandFilterValue && brandFilterValue !== 'All Brands') {
    dataQuery = dataQuery.eq('brand_name', brandFilterValue)
  }

  // Order and paginate
  const { data, error } = await dataQuery
    .order('created_at', { ascending: false })
    .range(start, end)

  if (error) {
    console.error(error)
    return
  }

  brandSkuMapping.set(data)
}
