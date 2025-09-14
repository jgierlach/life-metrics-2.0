/** @type {Record<string, number>} */
const monthNameToIndex = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
}

/**
 * @param {string | undefined} billingMonth
 * @returns {number}
 */
function toBillingMonthKey(billingMonth) {
  if (typeof billingMonth !== 'string') return Number.NEGATIVE_INFINITY
  const parts = billingMonth.split(',')
  if (parts.length !== 2) return Number.NEGATIVE_INFINITY
  const monthStr = parts[0]?.trim().toLowerCase()
  const yearStr = parts[1]?.trim()
  const year = parseInt(yearStr, 10)
  const monthIndex = monthNameToIndex[monthStr]
  if (!Number.isFinite(year) || monthIndex === undefined) return Number.NEGATIVE_INFINITY
  return year * 12 + monthIndex
}

/**
 * @param {{ billing_month?: string }} a
 * @param {{ billing_month?: string }} b
 * @returns {number}
 */
export const compareInvoicesByBillingMonthDesc = (a, b) => {
  const keyA = toBillingMonthKey(a?.billing_month)
  const keyB = toBillingMonthKey(b?.billing_month)
  return keyB - keyA
}

export const calculate3plFeesForOrder = (billingInfo, order) => {
  if (!billingInfo) return 0

  const freightPercentageMarkup = parseFloat(billingInfo?.freight_percentage_markup || 0) / 100
  const freightMarkup = (order?.cost_of_shipment || 0) * freightPercentageMarkup
  const baseOrderFee = parseFloat(billingInfo?.per_order_fee || 0)
  const perUnitFee = (order?.total_unit_quantity || 0) * (billingInfo?.per_order_unit_fee || 0)

  return baseOrderFee + perUnitFee + freightMarkup
}

import { newOrderNotificationEmailTemplate } from '$lib/emailTemplates'

export const sendNewOrderNotificationEmail = async (
  notificationEmail,
  order_number,
  brand_name,
  order_type,
  customer_name,
  street1,
  city,
  state,
  postal_code,
  country,
  orderId,
  sendGridApiKey,
) => {
  const endpoint = 'https://api.sendgrid.com/v3/mail/send'
  const emailData = {
    personalizations: [
      {
        to: [
          { email: notificationEmail }, // Ensure this email is correctly formatted
          { email: 'storageandfulfillment@hometown-industries.com' },
        ],
        subject: `New Order Created For ${brand_name} - ${order_number}`,
      },
    ],
    from: { email: 'storageandfulfillment@hometown-industries.com', name: 'New Order' },
    content: [
      {
        type: 'text/html',
        value: newOrderNotificationEmailTemplate(
          order_number,
          brand_name,
          order_type,
          customer_name,
          street1,
          city,
          state,
          postal_code,
          country,
          orderId,
        ),
      },
    ],
  }

  await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sendGridApiKey}`,
    },
    body: JSON.stringify(emailData),
  })
}

export const formatDateForInvoices = (date) => {
  const parsedDate = new Date(date + 'T00:00:00') // Ensure the date is treated as local time
  const day = String(parsedDate.getDate()).padStart(2, '0')
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0') // January is 0, so we need to add 1
  const year = parsedDate.getFullYear()
  return `${month}/${day}/${year}`
}

export const findIfHasOverdueUnpaidInvoice = (invoices) => {
  console.log('invoices', invoices)
  const today = new Date()

  // Check if any "Unpaid" invoice is past due
  const hasOverdueUnpaidInvoice = invoices.some((invoice) => {
    if (invoice.payment_status === 'Unpaid') {
      if (!invoice.date_due) {
        // If date_due is null, treat it as unpaid but not overdue
        return false
      }

      const dueDate = new Date(invoice.date_due)
      if (!isNaN(dueDate.getTime())) {
        // If due date is valid, check if today is past the due date
        return today > dueDate
      }
    }
    return false // Ignore non-"Unpaid" invoices
  })

  // Return true if there are overdue unpaid invoices
  return hasOverdueUnpaidInvoice
}

export const orderTypes = [
  {
    label: 'Customer Order',
    value: 'customer_order',
  },
  {
    label: 'B2B Order',
    value: 'b2b_order',
  },
  {
    label: 'Amazon FBA',
    value: 'amazon_fba',
  },
  {
    label: 'Walmart Fulfillment Services',
    value: 'walmart_fulfillment_services',
  },
  {
    label: 'Chewy.com',
    value: 'chewy',
  },
]

export const isInvoicePastDue = (invoice) => {
  const today = new Date()
  return invoice?.payment_status !== 'Paid' && today > new Date(invoice?.date_due)
}

export const calculateRevenueCollectedForSelectedMonth = (invoices) => {
  return invoices.reduce((acc, invoice) => {
    if (invoice?.payment_status === 'Paid') {
      return acc + invoice?.invoice_total
    }
    return acc
  }, 0)
}

export const calculateRevenueBilledForSelectedMonth = (invoices) => {
  return invoices.reduce((acc, invoice) => acc + invoice?.invoice_total, 0)
}

export const alphabetizeByBrandName = (arr) => {
  return arr.slice().sort((a, b) => {
    const nameA = a['brand_name'].toUpperCase()
    const nameB = b['brand_name'].toUpperCase()
    if (nameA < nameB) {
      return -1
    }
    if (nameA > nameB) {
      return 1
    }
    return 0
  })
}

export const findInvoicesForSelectedMonth = (invoices, selectedBillingMonthAndYear) => {
  return invoices.filter((invoice) => invoice.billing_month === selectedBillingMonthAndYear)
}

export const getCurrentBillingMonthAndYear = () => {
  const date = new Date()
  const currentMonthAndYear = `${date.toLocaleString('default', { month: 'long' })}, ${date.getFullYear()}`
  return getPreviousMonthAndYear(currentMonthAndYear)
}

export const getPreviousMonthAndYear = (monthYear) => {
  if (!monthYear) return ''
  const date = parseMonthYear(monthYear)
  date.setMonth(date.getMonth() - 1)
  return formatMonthYear(date)
}

// Example utility function to parse "Month, Year" into a Date object
function parseMonthYear(monthYear) {
  const [month, year] = monthYear.split(', ')
  return new Date(`${month} 1, ${year}`)
}

// Example utility function to format a Date object back into "Month, Year"
function formatMonthYear(date) {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()
  return `${month}, ${year}`
}

export const generateBillingMonthsAndYears = (rows) => {
  return sortBillingMonthsAndYears([...new Set(rows.map((row) => row.billing_month))])
}

export const sortBillingMonthsAndYears = (dates) => {
  return dates.sort((a, b) => {
    const [monthA, yearA] = a.split(', ').map((str) => str.trim())
    const [monthB, yearB] = b.split(', ').map((str) => str.trim())
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
    const yearDiff = parseInt(yearA) - parseInt(yearB)
    if (yearDiff !== 0) {
      return yearDiff
    }
    return months.indexOf(monthA) - months.indexOf(monthB)
  })
}

export const generateUniqueShippingNumber = () => {
  const timestamp = Date.now() // Current timestamp in milliseconds
  const randomPart = Math.floor(Math.random() * 100000) // Random number between 0 and 99999
  const uniqueShippingNumber = `SHIP-${timestamp}-${randomPart}`
  return uniqueShippingNumber
}

export const sendTrackingUpdateEmail = async (
  notificationEmail,
  orderNumber,
  carrier,
  trackingNumber,
  customerName,
  sendGridApiKey,
) => {
  const endpoint = 'https://api.sendgrid.com/v3/mail/send'

  const emailData = {
    personalizations: [
      {
        to: [
          { email: notificationEmail }, // Ensure this email is correctly formatted
          { email: 'storageandfulfillment@hometown-industries.com' },
        ],
        subject: `Tracking has been updated for Shipment Number: ${orderNumber}`,
      },
    ],
    from: { email: 'storageandfulfillment@hometown-industries.com', name: 'Inventory Update' },
    content: [
      {
        type: 'text/html',
        value: `
      <p>Tracking has been updated for Shipment Number: <strong>${orderNumber}</strong></p> 
      <ul>
        <li><strong>Carrier:</strong> ${carrier}</li>
        <li><strong>Tracking Number:</strong> ${trackingNumber}</li>
        <li><strong>Customer Name:</strong> ${customerName}</li>
      </ul>
       <p>For more details on the shipment, please login to your <a href="https://3pl.hometown-industries.com/"><strong>Client Portal</strong></a>.</p>`,
      },
    ],
  }

  await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sendGridApiKey}`,
    },
    body: JSON.stringify(emailData),
  })
}

export const findStoreNameBasedOnId = (storeId, stores) => {
  if (storeId === null || storeId === undefined) {
    console.log('storeId is null or undefined')
    return ''
  }
  if (stores === null || stores === undefined) {
    console.log('Stores api call came back as null or undefined')
    return ''
  }
  const store = stores.find((store) => store.storeId === storeId)
  return store ? store.storeName : null
}

export const assignBrandIdBasedOnStoreName = (storeName) => {
  // Get Your Thing categorization
  if (storeName === 'Get Your Thing Amazon') {
    return 'orders@getyourthing.com'
  }
  if (storeName === 'Get Your Thing Amazon 2') {
    return 'orders@getyourthing.com'
  }
  // Veto Athletics categorization
  if (storeName === 'Veto Athletics Shopify') {
    return 'staff@vetoathletic.com'
  }
  // LadyWell categorization
  if (storeName === 'Ladywell Amazon') {
    return 'ashley@getladywell.com'
  }
  if (storeName === 'Ladywell Shopify') {
    return 'ashley@getladywell.com'
  }
  // Going Commando categorization
  if (storeName === 'Going Commando Shopify') {
    return 'contact@goingcommando.io'
  }
  // Dog Rocks categorization
  if (storeName === 'Dog Rocks Walmart') {
    return 'operations@podiumpetproducts.com'
  }
  if (storeName === 'Dog Rocks Website') {
    return 'operations@podiumpetproducts.com'
  }
  if (storeName === 'Dog Rocks Faire') {
    return 'operations@podiumpetproducts.com'
  }
  if (storeName === 'Dog Rocks Amazon') {
    return 'operations@podiumpetproducts.com'
  }
  if (storeName === 'Dog Rocks Canada') {
    return 'operations@podiumpetproducts.com'
  }
  if (storeName === 'Dog Rocks Mexico') {
    return 'operations@podiumpetproducts.com'
  }
  if (storeName === 'Dog Rocks Shopify') {
    return 'operations@podiumpetproducts.com'
  }
  // Bessies Best categorization
  if (storeName === `Bessies Best Amazon`) {
    return 'jen@bessiesbest.com'
  }
  // Dr. Appleseed categorization
  if (storeName === 'Dr. Appleseed Amazon') {
    return 'drappleseedextracts@gmail.com'
  }
  if (storeName === 'Dr. Appleseed Faire') {
    return 'drappleseedextracts@gmail.com'
  }
  if (storeName === 'Dr. Appleseed Shopify') {
    return 'drappleseedextracts@gmail.com'
  }
  // Drink Ballast categorization
  if (storeName === 'Drink Ballast Wix') {
    return 'roy@drinkballast.com'
  }
  if (storeName === 'Drink Ballast Shopify') {
    return 'roy@drinkballast.com'
  }
  // Jewell Nursing categorization
  if (storeName === 'Jewell Nursing Website') {
    return 'support@jewellnursingsolutions.com'
  }
  // Hometown categorization
  if (storeName === 'Hometown Amazon') {
    return 'homeinddistribution@gmail.com'
  }
  if (storeName === 'Hometown eBay') {
    return 'homeinddistribution@gmail.com'
  }
  if (storeName === 'Hometown Walmart') {
    return 'homeinddistribution@gmail.com'
  }
  if (storeName === 'FilterPal Shopify') {
    return 'homeinddistribution@gmail.com'
  }
  if (storeName === "Rob Edward's Shopify") {
    return 'homeinddistribution@gmail.com'
  }
  return 'clientId Not Found'
}

export const updateOrderWithBrandIdAndBrandName = async (supabase, brandId, brandName, orderId) => {
  const { error: updateError } = await supabase
    .from('orders')
    .update({ brand_id: brandId, brand_name: brandName })
    .eq('id', orderId)

  if (updateError) {
    console.error(
      `Error updating order ${orderId} with brand_id ${brandId} and brand_name ${brandName}`,
      updateError,
    )
  } else {
    console.log(
      `Successfully updated order ${orderId} with brand_id ${brandId} and brand_name ${brandName}`,
    )
  }
}

export const calculateReferralFee = (items, products, marketplace) => {
  const totalPaid = calculateTotalPaid(items, products)

  if (marketplace === 'amazon') {
    return totalPaid * 0.15
  } else if (marketplace === 'ebay') {
    return totalPaid * 0.15
  } else if (marketplace === 'shopify') {
    return 0 // Shopify doesn't charge referral fees like marketplaces
  } else {
    return 0
  }
}

export const calculateTotalPaid = (items, products) => {
  return items.reduce((acc, item) => {
    let unitPrice = item?.unitPrice || item?.price || 0
    let quantity = item?.quantity || 0
    let asin = item?.sku || null

    // If unitPrice is 0 or undefined, try to find it in products
    if (unitPrice === 0 || unitPrice === undefined) {
      const product = products.find((product) => product?.asin === asin)
      unitPrice = product?.price || 0
    }

    return acc + Number(unitPrice) * Number(quantity)
  }, 0)
}

export const updateProductQuantity = async (supabase, newQuantity, productId) => {
  const { error: updateError } = await supabase
    .from('products')
    .update({ quantity: newQuantity })
    .eq('id', productId)

  if (updateError) {
    console.error(`Error updating inventory for product_id ${productId}:`, updateError)
  } else {
    console.log(
      `Successfully updated inventory for product_id ${productId}. New quantity: ${newQuantity}`,
    )
  }
}

export const updateChangelogInWebhook = async (
  supabase,
  previousQuantity,
  newQuantity,
  netChange,
  imageUrl,
  brandId,
  brandName,
  orderNumber,
  changeSource,
  name,
  sku,
  productId,
) => {
  const log = {
    previous_quantity: previousQuantity,
    new_quantity: newQuantity,
    net_change: netChange,
    image_url: imageUrl,
    brand_id: brandId,
    brand_name: brandName,
    order_number: orderNumber,
    change_source: changeSource,
    name,
    sku,
    product_id: productId,
  }

  const { error: logError } = await supabase.from('inventory_changelog').insert([log])

  if (logError) {
    console.error('Supabase error: inserting into inventory_changelog table', logError)
  }
}

export const insertUnmappedSku = async (
  supabase,
  sku,
  brandId,
  brandName,
  quantity,
  orderNumber,
  orderSource,
  name,
  imageUrl,
) => {
  const unmappedSku = {
    sku,
    brand_id: brandId,
    brand_name: brandName,
    quantity,
    order_number: orderNumber,
    order_source: orderSource,
    name,
    image_url: imageUrl,
  }

  const { error: insertError } = await supabase.from('unmapped_skus').insert([unmappedSku])

  if (insertError) {
    console.error('Supabase error: inserting into unmapped_skus table', insertError)
  }
}

export const sendUnmappedSkuNotification = async (
  sku,
  name,
  quantity,
  orderNumber,
  sendGridApiKey,
) => {
  const endpoint = 'https://api.sendgrid.com/v3/mail/send'
  const emailData = {
    personalizations: [
      {
        to: [{ email: 'jan@hometown-industries.com' }],
        subject: `Sku Value: ${sku} not found in Sku Mapping Table`,
      },
    ],
    from: {
      email: 'storageandfulfillment@hometown-industries.com',
      name: 'Sku Mapping',
    },
    content: [
      {
        type: 'text/html',
        value: `
        <p>Sku Value: <strong>${sku}</strong> not found in Sku Mapping table.</p>
        <ul>
          <li>Product Name: <strong>${name}</strong></li>
          <li>Quantity: <strong>${quantity}</strong></li>
          <li>Shipment Number: <strong>${orderNumber}</strong></li>
          <li>Order Source: <strong>amazon</strong></li>
        </ul>
        <p>The shipment number associated with this sku is <strong>${orderNumber}</strong></p>`,
      },
    ],
  }
  try {
    const emailResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sendGridApiKey}`,
      },
      body: JSON.stringify(emailData),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json().catch(() => null)
      console.error('Failed to send email notification:', {
        status: emailResponse.status,
        statusText: emailResponse.statusText,
        error: errorData,
      })
    } else {
      console.log(`Email notification sent successfully for unmapped SKU: ${sku}`)
    }
  } catch (error) {
    console.error('Error sending email notification:', error?.message)
  }
}

export const updateChangelogOnEditProduct = async (
  supabase,
  productId,
  newQuantity,
  imageUrl,
  brandId,
  brandName,
  name,
  sku,
) => {
  const { data, error } = await supabase.from('products').select('*').eq('id', productId).single()

  if (error) {
    console.error('Error fetching product:', error)
  }

  const previousQuantity = data?.quantity || 0

  // Check to see if the newQuantity matches the previous quantity
  if (newQuantity === previousQuantity) {
    console.log('No change in quantity')
    return
  }

  // Otherwise calculate the difference between the newQuantity and the previous and insert a changelog
  const netChange = newQuantity - previousQuantity

  const { data: changelogData, error: changelogError } = await supabase
    .from('inventory_changelog')
    .insert({
      product_id: productId,
      previous_quantity: previousQuantity,
      new_quantity: newQuantity,
      net_change: netChange,
      image_url: imageUrl,
      brand_id: brandId,
      brand_name: brandName,
      name: name,
      sku: sku,
      change_source: 'Hometown Admin',
      order_number: null,
    })

  if (changelogError) {
    console.error('Error inserting changelog:', changelogError)
  }
}

export const displayDistributionPartnersAnd3plCustomers = (users) => {
  return users
    .filter(
      (user) =>
        user?.service_role === 'distribution_partner' || user?.service_role === '3pl_customer',
    )
    .map((user) => user?.name)
    .sort((a, b) => a?.localeCompare(b))
}

export const displayDistributionPartners = (users) => {
  return users
    .filter((user) => user?.service_role === 'distribution_partner')
    .map((user) => user?.name)
    .sort((a, b) => a?.localeCompare(b))
}

export const display3plCustomers = (users) => {
  return users
    .filter((user) => user?.service_role === '3pl_customer')
    .map((user) => user?.name)
    .sort((a, b) => a?.name?.localeCompare(b?.name))
}

export const display3plCustomersToInvoice = (users) => {
  return users
    .filter((user) => user?.service_role === '3pl_customer')
    .sort((a, b) => a?.name?.localeCompare(b?.name))
}

export const formatReadableDate = (dateString) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export const generatePOId = () => {
  const timestamp = Date.now() // Current timestamp in milliseconds
  const randomPart = Math.floor(Math.random() * 100000) // Random number between 0 and 99999
  const uniqueNumber = `${timestamp}-${randomPart}`
  return uniqueNumber
}

export const formatTimeStampForChangelog = (dateString) => {
  const options = {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }

  const date = new Date(dateString)
  const formatter = new Intl.DateTimeFormat('en-US', options)
  const [monthDay, time] = formatter.format(date).split(', ')

  // Extract day suffix
  const day = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    timeZone: 'America/Chicago',
  }).format(date)
  const suffix = getDaySuffix(day)

  return `${monthDay}${suffix}, ${time} CST`
}

export const getDaySuffix = (day) => {
  if (day.endsWith('1') && !day.endsWith('11')) return 'st'
  if (day.endsWith('2') && !day.endsWith('12')) return 'nd'
  if (day.endsWith('3') && !day.endsWith('13')) return 'rd'
  return 'th'
}

export const formatTimeStamp = (timestamp) => {
  const date = new Date(timestamp)

  // Get the month, day, and year in UTC to avoid timezone conversion issues
  const month = String(date.getUTCMonth() + 1).padStart(2, '0') // UTC month (0-based)
  const day = String(date.getUTCDate()).padStart(2, '0') // UTC day
  const year = date.getUTCFullYear() // UTC year

  // Return the formatted date in MM/DD/YYYY format
  return `${month}/${day}/${year}`
}

export const findBrandNameByClientId = (arr, brandId) => {
  const foundObject = arr.find((obj) => obj?.brand_id === brandId)
  return foundObject ? foundObject.brand_name : brandId
}

export const findBrandNameByBrandId = (users, brandId) => {
  return users.find((user) => user?.email === brandId)?.name
}

export const formatUnitsSoldByDay = (usersProductSales) => {
  const unitsSoldMap = new Map()

  usersProductSales.forEach((sale) => {
    const { order_date, quantity } = sale
    // Ensure order_date and quantity are correctly extracted
    if (!order_date || !quantity) {
      console.error('Invalid sale entry:', sale)
      return
    }

    let numericQuantity = 0
    if (quantity === null || quantity === undefined) {
      numericQuantity = 0
    } else {
      numericQuantity = quantity
    }
    if (isNaN(numericQuantity)) {
      console.error('Invalid quantity value:', quantity)
      return
    }

    // Get only the date part of order_date (assuming order_date is in ISO format)
    const date = order_date.split('T')[0]

    // Accumulate units sold by date
    if (unitsSoldMap.has(date)) {
      unitsSoldMap.set(date, unitsSoldMap.get(date) + numericQuantity)
    } else {
      unitsSoldMap.set(date, numericQuantity)
    }
  })

  // Convert the Map to an array of objects
  const unitsSoldArray = Array.from(unitsSoldMap.entries()).map(([date, unitsSold]) => ({
    date,
    unitsSold,
  }))

  // Optional: Sort the array by date
  unitsSoldArray.sort((a, b) => new Date(a.date) - new Date(b.date))

  return unitsSoldArray
}

export const formatSalesByDay = (usersProductSales) => {
  const revenueMap = new Map()

  usersProductSales.forEach((sale) => {
    const { order_date, total_paid } = sale
    // Ensure order_date and total_paid are correctly extracted
    if (!order_date || !total_paid) {
      console.error('Invalid sale entry:', sale)
      return
    }

    let numericRevenue = 0
    if (total_paid === null || total_paid === undefined) {
      numericRevenue = 0
    } else {
      // Remove dollar sign and parse the total_paid as a float
      numericRevenue = total_paid
    }
    if (isNaN(numericRevenue)) {
      console.error('Invalid total_paid value:', total_paid)
      return
    }

    // Get only the date part of order_date (assuming order_date is in ISO format)
    const date = order_date.split('T')[0]

    // Accumulate revenue by date
    if (revenueMap.has(date)) {
      revenueMap.set(date, revenueMap.get(date) + numericRevenue)
    } else {
      revenueMap.set(date, numericRevenue)
    }
  })

  // Convert the Map to an array of objects
  const revenueArray = Array.from(revenueMap.entries()).map(([date, revenue]) => ({
    date,
    revenue,
  }))

  // Optional: Sort the array by date
  revenueArray.sort((a, b) => new Date(a.date) - new Date(b.date))

  return revenueArray
}

export const isGreaterThan60Days = (startDate, endDate) => {
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  const differenceInTime = end - start
  const differenceInDays = differenceInTime / (1000 * 3600 * 24)

  console.log('DIFFERENCE IN DAYS', differenceInDays)
  return differenceInDays > 60
}

export const removeFirstIndex = (array) => {
  if (array.length === 0) return array // Check if the array is empty
  array.shift() // Remove the first element
  return array // Return the modified array
}

export const csvGenerator = (totalData, actualHeaderKey, headerToShow, fileName) => {
  let data = totalData || null
  if (data == null || !data.length) {
    return null
  }
  let columnDelimiter = ','
  let lineDelimiter = '\n'
  let keys = headerToShow
  let result = ''
  result += keys.join(columnDelimiter)
  result += lineDelimiter
  data.forEach(function (item) {
    let ctr = 0
    actualHeaderKey.forEach(function (key) {
      if (ctr > 0) result += columnDelimiter
      if (Array.isArray(item[key])) {
        let arrayItem = item[key] && item[key].length > 0 ? '"' + item[key].join(',') + '"' : '-'
        result += arrayItem
      } else if (typeof item[key] == 'string') {
        let strItem = item[key] ? '"' + item[key] + '"' : '-'
        result += strItem ? strItem.replace(/\s{2,}/g, ' ') : strItem
      } else {
        let strItem = item[key] + ''
        result += strItem ? strItem.replace(/,/g, '') : strItem
      }

      ctr++
    })
    result += lineDelimiter
  })

  if (result == null) return

  var blob = new Blob([result])
  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, exportedFilenmae)
  } else if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
    var hiddenElement = window.document.createElement('a')
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(result)
    hiddenElement.target = '_blank'
    hiddenElement.download = fileName
    hiddenElement.click()
  } else {
    let link = document.createElement('a')
    if (link.download !== undefined) {
      // Browsers that support HTML5 download attribute
      var url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', fileName)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
}

export const formatGraphDate = (dateString) => {
  const date = new Date(dateString + 'T00:00:00Z')

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const month = monthNames[date.getUTCMonth()]
  const day = date.getUTCDate()
  const year = date.getUTCFullYear()

  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th'
    switch (day % 10) {
      case 1:
        return 'st'
      case 2:
        return 'nd'
      case 3:
        return 'rd'
      default:
        return 'th'
    }
  }

  const ordinalSuffix = getOrdinalSuffix(day)

  return `${month} ${day}${ordinalSuffix}, ${year}`
}

export const formatUnitsSoldByMonth = (usersProductSales) => {
  const monthUnitsSoldMap = {}

  usersProductSales.forEach((sale) => {
    const date = new Date(sale.order_date)
    const monthYear = date.toLocaleString('default', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })
    const unitsSold = sale?.quantity

    if (monthUnitsSoldMap[monthYear]) {
      monthUnitsSoldMap[monthYear] += unitsSold
    } else {
      monthUnitsSoldMap[monthYear] = unitsSold
    }
  })

  const result = Object.keys(monthUnitsSoldMap).map((monthYear) => ({
    month: monthYear,
    totalUnitsSold: monthUnitsSoldMap[monthYear],
  }))

  result.sort((a, b) => new Date(a.month) - new Date(b.month))

  return result
}

export const formatSalesByMonth = (usersProductSales) => {
  const monthRevenueMap = {}

  usersProductSales.forEach((sale) => {
    const date = new Date(sale.order_date)
    const monthYear = date.toLocaleString('default', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })
    const revenue = sale.total_paid

    if (monthRevenueMap[monthYear]) {
      monthRevenueMap[monthYear] += revenue
    } else {
      monthRevenueMap[monthYear] = revenue
    }
  })

  const result = Object.keys(monthRevenueMap).map((monthYear) => ({
    month: monthYear,
    totalRevenue: parseFloat(monthRevenueMap[monthYear].toFixed(2)),
  }))

  result.sort((a, b) => new Date(a.month) - new Date(b.month))

  return result
}

export const formatDollarValue = (number) => {
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(number)
  return formattedValue
}

export const calculateTotalSales = (usersProductSales) => {
  return usersProductSales.reduce((total, sale) => {
    const revenue = sale.total_paid
    return total + revenue
  }, 0)
}

export const calculateTotalUnitsSold = (unitsSold) => {
  return unitsSold.reduce((acc, curr) => acc + curr?.quantity, 0)
}

export const calculateUsersProductSales = (usersProductSales) => {
  return usersProductSales.reduce((total, product) => {
    let revenue = 0
    if (product.total_paid === null || product.total_paid === undefined) {
      revenue = 0
    } else {
      revenue = product.total_paid
    }
    return total + revenue
  }, 0)
}

export const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const generateMonthsArray = () => {
  const startDate = new Date('2023-06-01')
  const endDate = new Date()
  const monthsArray = []
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  let currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const month = monthNames[currentDate.getMonth()]
    const year = currentDate.getFullYear()
    monthsArray.push(`${month}, ${year}`)

    // Move to the next month
    currentDate.setMonth(currentDate.getMonth() + 1)
  }

  return monthsArray
}

export const numberOfBestSellersToDisplay = (bestSellers, number) => {
  return Array.isArray(bestSellers) ? bestSellers.slice(0, number) : []
}

export const abbreviateString = (str, maxLength, abbreviationSymbol = '...') => {
  if (typeof str !== 'string' || typeof maxLength !== 'number' || maxLength < 1) {
    console.log('There is no Stripe Invoice Link for this contract')
    return ''
  }

  if (str.length <= maxLength) {
    return str
  }

  const abbreviationLength = abbreviationSymbol.length
  if (maxLength < abbreviationLength + 1) {
    return str.slice(0, maxLength)
  }

  return str.slice(0, maxLength - abbreviationLength) + abbreviationSymbol
}

export const fiftyStates = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
]

export const getUsersSalesBySku = (userAsins, salesBySku) => {
  return salesBySku.filter((product) => userAsins.includes(product.asin))
}

export const getUsersProductSales = (userAsins, productSales) => {
  return productSales.filter((product) => userAsins.includes(product.asin))
}

export const test = () => {
  console.log('TEST')
}
