import { json } from '@sveltejs/kit'

/**
 * @param {{ url: URL, locals: { supabase: any } }} params
 */
export async function GET({ url, locals }) {
  const startDate = url.searchParams.get('start_date')
  const endDate = url.searchParams.get('end_date')
  const brandId = url.searchParams.get('brand_id')

  if (!startDate || !endDate) {
    return json({
      status: 400,
      body: { message: 'Missing startDate or endDate parameter' },
    })
  }

  if (!brandId) {
    return json({
      status: 400,
      body: { message: 'Missing brand_id parameter' },
    })
  }

  // Handle start and end dates, ensuring full day coverage for endDate
  const startDateTime = new Date(startDate)
  const endDateTime = new Date(endDate)

  // Adjust the end date to the start of the next day to include full day results
  const nextDay = new Date(endDateTime)
  nextDay.setUTCDate(endDateTime.getUTCDate() + 1) // Move to next day
  nextDay.setUTCHours(0, 0, 0, 0) // Set to midnight UTC of the next day

  // Format both dates for UTC
  const formattedStartDate = startDateTime.toISOString()
  const formattedEndDate = nextDay.toISOString()

  try {
    // Use SQL aggregation to group by SKU and calculate totals directly in the database
    const { data, error } = await locals.supabase
      .from('order_line_items')
      .select(
        `
        sku,
        product_name,
        asin,
        image_url,
        quantity,
        orders!inner(order_date, total_paid, brand_id)
      `,
      )
      .gte('orders.order_date', formattedStartDate)
      .lt('orders.order_date', formattedEndDate)
      .eq('orders.brand_id', brandId) // Filter by brand_id
      .not('orders.total_paid', 'is', null)
      .not('sku', 'is', null)
      .gt('quantity', 0)

    if (error) {
      console.error('Supabase error:', error.message, error.details)
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error('No data returned from Supabase')
    }

    // Aggregate the results by SKU (minimal JavaScript processing)
    const unitsBySkuMap = new Map()

    data.forEach(
      /** @param {any} lineItem */ (lineItem) => {
        const sku = lineItem.sku
        const productName = lineItem.product_name || lineItem.sku || 'Unknown Product'
        const quantity = lineItem.quantity || 0

        if (sku && quantity > 0) {
          if (unitsBySkuMap.has(sku)) {
            const existing = unitsBySkuMap.get(sku)
            existing.total_units += quantity
          } else {
            unitsBySkuMap.set(sku, {
              sku: sku,
              product_name: productName,
              total_units: quantity,
              asin: lineItem.asin || null,
              image_url: lineItem.image_url || null,
            })
          }
        }
      },
    )

    // Convert map to array and sort by total units (descending)
    const unitsBySkuArray = Array.from(unitsBySkuMap.values()).sort(
      (a, b) => b.total_units - a.total_units,
    )

    return json({
      status: 200,
      body: unitsBySkuArray,
    })
  } catch (/** @type {any} */ error) {
    console.error('Error in GET request:', error)
    return json({
      status: 500,
      body: { message: 'Failed to fetch products with highest revenues', error: error.message },
    })
  }
}
