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

  // Parse start and end dates, and ensure the end date captures the entire day
  const startDateTime = new Date(startDate)
  const endDateTime = new Date(endDate)

  // Adjust the end date to the *start* of the next day, to exclude any sales on the next day
  const nextDay = new Date(endDateTime)
  nextDay.setUTCDate(endDateTime.getUTCDate() + 1) // Move to the start of the next day
  nextDay.setUTCHours(0, 0, 0, 0) // Set to midnight UTC of the next day

  // Format both dates to UTC
  const formattedStartDate = startDateTime.toISOString()
  const formattedEndDate = nextDay.toISOString() // Start of the next day

  try {
    // Use efficient join query instead of nested select to get line items with order data
    const { data, error } = await locals.supabase
      .from('order_line_items')
      .select(
        `
        *,
        orders!inner(*)
      `,
      )
      .gte('orders.order_date', formattedStartDate)
      .lt('orders.order_date', formattedEndDate)
      .eq('orders.brand_id', brandId) // Filter by brand_id
      .not('orders.total_paid', 'is', null)
      .limit(10000) // Safety limit to prevent excessive data

    if (error) {
      console.error('Supabase error:', error.message, error.details)
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error('No data returned from Supabase')
    }

    // Transform the data to flatten the structure using existing line_total
    const sales = data.map(
      /** @param {any} lineItem */ (lineItem) => {
        return {
          // Spread all order fields
          ...lineItem.orders,
          // Spread all line item fields (will override any order fields with same name)
          ...lineItem,
          // Remove the nested orders object
          orders: undefined,
          // Use existing line_total from database
          total_paid: lineItem.line_total || 0,
        }
      },
    )

    // Remove duplicates based on order_number-sku combination
    const uniqueKeys = new Set()
    const deduplicatedSales = sales.filter(
      /** @param {any} sale */ (sale) => {
        if (sale.order_number && sale.sku) {
          const key = `${sale.order_number}-${sale.sku}`
          if (uniqueKeys.has(key)) {
            return false // Skip duplicates
          }
          uniqueKeys.add(key)
          return true // Keep the first occurrence
        }
        return true // Keep entries missing either field
      },
    )

    console.log(`Total line items from DB: ${data.length}`)
    console.log(`After deduplication: ${deduplicatedSales.length}`)

    return json({
      status: 200,
      body: deduplicatedSales,
    })
  } catch (/** @type {any} */ error) {
    console.error('Error in GET request:', error)
    return json({
      status: 500,
      body: { message: 'Failed to fetch product sales', error: error.message },
    })
  }
}
