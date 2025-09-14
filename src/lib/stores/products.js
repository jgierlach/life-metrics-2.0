import { writable, get, derived } from 'svelte/store'

/** @type {import('svelte/store').Writable<any[]>} */
export const products = writable([])
export const totalProductCount = writable(0)
export const currentPage = writable(1)
export const pageSize = writable(50)
export const searchQuery = writable('')
export const allMatchingProducts = writable(/** @type {any[]} */ ([]))

// Calculate inventory value based on ALL matching products, not just current page
export const totalInventoryValue = derived(allMatchingProducts, ($allMatchingProducts) => {
  return $allMatchingProducts.reduce((total, product) => {
    const quantity = product?.quantity ?? 0
    const costOfGood = product?.cost_of_good ?? 0
    return total + quantity * costOfGood
  }, 0)
})

// Calculate inventory value of the projected PO quantity
export const totalProjectedPoValue = derived(allMatchingProducts, ($allMatchingProducts) => {
  return $allMatchingProducts.reduce((total, product) => {
    const quantity = product?.projected_po_quantity ?? 0
    const costOfGood = product?.cost_of_good ?? 0
    return total + quantity * costOfGood
  }, 0)
})

/**
 * Loads paginated and sorted product data filtered by brand_id.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} brandId - The brand_id to filter by
 */
export const loadProducts = async (supabase, brandId) => {
  if (!brandId) {
    console.error('brandId is required for loadProducts')
    return
  }

  const currentPageValue = get(currentPage)
  const pageSizeValue = get(pageSize)
  const searchQueryValue = get(searchQuery)
  const start = (currentPageValue - 1) * pageSizeValue
  const end = start + pageSizeValue - 1

  try {
    // Base query for count - always filter by brand_id
    let countQuery = supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brandId)

    // Create query for all products matching the filters (for total inventory value)
    let allProductsQuery = supabase.from('products').select('*').eq('brand_id', brandId)

    // Apply search filter if query exists - search by SKU, ASIN, or name
    if (searchQueryValue && searchQueryValue.trim() !== '') {
      const trimmedQuery = searchQueryValue.trim()
      countQuery = countQuery.or(
        `sku.ilike.%${trimmedQuery}%,asin.ilike.%${trimmedQuery}%,name.ilike.%${trimmedQuery}%`,
      )
      allProductsQuery = allProductsQuery.or(
        `sku.ilike.%${trimmedQuery}%,asin.ilike.%${trimmedQuery}%,name.ilike.%${trimmedQuery}%`,
      )
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Count error:', countError)
      return
    }

    totalProductCount.set(count || 0)

    // Fetch ALL matching products (without pagination) for total inventory value calculation
    const { data: allMatchingData, error: allMatchingError } = await allProductsQuery.order(
      'created_at',
      { ascending: false },
    )

    if (allMatchingError) {
      console.error('All matching data fetch error:', allMatchingError)
    } else {
      allMatchingProducts.set(allMatchingData || [])
    }

    // Fetch paginated products for display
    let dataQuery = supabase.from('products').select('*').eq('brand_id', brandId)

    // Apply same search filter to data query - search by SKU, ASIN, or name
    if (searchQueryValue && searchQueryValue.trim() !== '') {
      const trimmedQuery = searchQueryValue.trim()
      dataQuery = dataQuery.or(
        `sku.ilike.%${trimmedQuery}%,asin.ilike.%${trimmedQuery}%,name.ilike.%${trimmedQuery}%`,
      )
    }

    // Order and paginate
    const { data, error } = await dataQuery
      .order('created_at', { ascending: false })
      .range(start, end)

    if (error) {
      console.error('Data fetch error:', error)
      return
    }

    products.set(data)
  } catch (error) {
    console.error('Error in loadProducts:', error)
  }
}
