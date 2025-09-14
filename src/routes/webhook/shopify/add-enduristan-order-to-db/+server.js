import { json } from '@sveltejs/kit'
import { SHIPSTATION_API_KEY, SHIPSTATION_SECRET, SEND_GRID_API_KEY } from '$env/static/private'
import {
  sendUnmappedSkuNotification,
  insertUnmappedSku,
  updateChangelogInWebhook,
  updateProductQuantity,
  calculateTotalPaid,
  calculateReferralFee,
} from '$lib/utils'

// Disable CSRF protection for this webhook route
export const config = { csrf: false }

// Helper to map Shopify order to ShipStation format
function mapShopifyToShipStation(order) {
  // Sum all shipping_lines prices (as numbers)
  const shippingAmount = Array.isArray(order.shipping_lines)
    ? order.shipping_lines.reduce((sum, line) => sum + Number(line.price), 0)
    : 0

  const discountAmount = order.total_discounts ? Number(order.total_discounts) : 0
  const taxAmount = order.total_tax ? Number(order.total_tax) : 0

  return {
    orderNumber: order.name,
    orderDate: order.created_at,
    orderStatus: 'awaiting_shipment',
    customerEmail: order.email || order.contact_email || '',
    customerUsername: order.customer
      ? `${order.customer.first_name ?? ''} ${order.customer.last_name ?? ''}`.trim()
      : '',
    internalNotes: order.note || '',
    billTo: {
      name: order.billing_address?.name || '',
      company: order.billing_address?.company || '',
      street1: order.billing_address?.address1 || '',
      city: order.billing_address?.city || '',
      state: order.billing_address?.province || '',
      postalCode: order.billing_address?.zip || '',
      country: order.billing_address?.country_code || 'US',
      phone: order.billing_address?.phone || '',
    },
    shipTo: {
      name: order.shipping_address?.name || '',
      company: order.shipping_address?.company || '',
      street1: order.shipping_address?.address1 || '',
      city: order.shipping_address?.city || '',
      state: order.shipping_address?.province || '',
      postalCode: order.shipping_address?.zip || '',
      country: order.shipping_address?.country_code || 'US',
      phone: order.shipping_address?.phone || '',
    },
    items: Array.isArray(order.line_items)
      ? order.line_items.map((item) => ({
          sku: item.sku || '',
          name: item.title || '',
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.price) || 0,
          warehouseLocation: '',
        }))
      : [],
    shippingAmount,
    discountAmount,
    taxAmount,
    amountPaid: order.total_price ? Number(order.total_price) : 0,
    orderKey: String(order.id || ''),
    orderSource: 'Shopify',
  }
}

export async function POST({ request, locals }) {
  try {
    const shopifyOrder = await request.json()

    console.log('Shopify webhook received:', shopifyOrder)

    // Load all products from the database
    const { data: products, error: productError } = await locals.supabase
      .from('products')
      .select('*')
      .eq('brand_id', 'login@enduristan.com')

    if (productError) {
      console.error('Error fetching products:', productError)
    }

    // Check if order already exists in database
    const { data: existingOrder, error: existingOrderError } = await locals.supabase
      .from('orders')
      .select('id')
      .eq('order_number', shopifyOrder.name)
      .single()

    if (existingOrderError && existingOrderError.code !== 'PGRST116') {
      console.error('Error checking for existing order:', existingOrderError)
      return json({ error: 'Database error checking existing order' }, { status: 500 })
    }

    if (existingOrder) {
      console.log(`Order ${shopifyOrder.name} already exists in database, skipping...`)
      return json({ message: 'Order already exists in database' }, { status: 200 })
    }

    // Map to ShipStation order format
    const orderData = mapShopifyToShipStation(shopifyOrder)

    // Post to ShipStation
    const response = await fetch('https://ssapi.shipstation.com/orders/createorder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' + Buffer.from(`${SHIPSTATION_API_KEY}:${SHIPSTATION_SECRET}`).toString('base64'),
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ShipStation API error:', errorText)
      return json({ error: errorText }, { status: 500 })
    }

    // Calculate shipping amount from Shopify order
    const shippingAmount = Array.isArray(shopifyOrder.shipping_lines)
      ? shopifyOrder.shipping_lines.reduce((sum, line) => sum + Number(line.price), 0)
      : 0

    // Create the order object for database insertion
    const orderInsertObj = {
      order_number: shopifyOrder.name,
      order_date: shopifyOrder.created_at,
      is_3pl_order: false,
      brand_id: 'login@enduristan.com',
      brand_name: 'Enduristan',
      order_source: 'shopify',
      customer_email: shopifyOrder.email || shopifyOrder.contact_email || null,
      customer_name:
        shopifyOrder.shipping_address?.name || shopifyOrder.customer
          ? `${shopifyOrder.customer.first_name ?? ''} ${shopifyOrder.customer.last_name ?? ''}`.trim()
          : null,
      recipient_company: shopifyOrder.shipping_address?.company || null,
      street1: shopifyOrder.shipping_address?.address1 || null,
      city: shopifyOrder.shipping_address?.city || null,
      state: shopifyOrder.shipping_address?.province || null,
      postal_code: shopifyOrder.shipping_address?.zip || null,
      country: shopifyOrder.shipping_address?.country_code || null,
      carrier: null,
      tracking_number: null,
      status: 'Pending',
      fulfillment_channel: 'Hometown', // Shopify orders are typically fulfilled by Hometown
      cost_of_shipment: shippingAmount,
      referral_fee: calculateReferralFee(shopifyOrder.line_items || [], products, 'shopify'),
      total_unit_quantity: Array.isArray(shopifyOrder.line_items)
        ? shopifyOrder.line_items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0)
        : 0,
      total_paid: Number(shopifyOrder.total_price) || 0,
      notes: shopifyOrder.note || null,
    }

    // Insert the order into the database
    const { data: insertedOrder, error: orderInsertError } = await locals.supabase
      .from('orders')
      .insert([orderInsertObj])
      .select() // Needed to return the inserted row and get the UUID

    if (orderInsertError || !insertedOrder || !insertedOrder[0]) {
      console.error('Error inserting order:', orderInsertError)
      return json({ error: 'Failed to insert order into database' }, { status: 500 })
    }

    const order_id = insertedOrder[0].id
    console.log('Order inserted with ID:', order_id)

    // Initialize order line items array
    const orderLineItems = []

    // Process line items
    if (Array.isArray(shopifyOrder.line_items)) {
      for (const item of shopifyOrder.line_items) {
        const sku = item?.sku || null
        const quantity = Number(item?.quantity) || 1
        const name = item?.title || item?.name || null
        const unitPrice = Number(item?.price) || 0

        // Check sku against the sku mapping table
        const { data: skuMappings, error: skuMappingError } = await locals.supabase
          .from('brand_sku_mapping')
          .select('*')
          .eq('sku', sku)

        if (skuMappingError) {
          console.error('Error fetching SKU mappings:', skuMappingError)
        }

        // No sku is found in the sku mapping table that matches the sku in the order
        if (!skuMappings || skuMappings.length === 0) {
          console.log('No SKU mapping found for', sku)

          // Insert row into unmapped_skus table
          await insertUnmappedSku(
            locals.supabase,
            sku,
            quantity,
            shopifyOrder.name,
            'shopify',
            name,
            null, // Shopify doesn't typically provide image URLs in line items
          )

          // Send an alert with SendGrid (uncomment if needed)
          // await sendUnmappedSkuNotification(sku, name, quantity, shopifyOrder.name, SEND_GRID_API_KEY)
        }

        // Initialize productId and costOfGood
        let productId = null
        let costOfGood = null

        // If sku mappings are found, execute lookup and deduct inventory quantity from correct product
        if (skuMappings && skuMappings.length > 0) {
          for (const skuMap of skuMappings) {
            const { product_id, quantity_to_deduct } = skuMap
            productId = product_id
            const valueToSubtractFromInventoryQuantity = quantity_to_deduct * quantity

            // Fetch the current inventory quantity
            const { data: inventoryData, error: fetchError } = await locals.supabase
              .from('products')
              .select('*')
              .eq('id', product_id)
              .single()

            if (fetchError) {
              console.error(`Error fetching inventory for product_id ${product_id}:`, fetchError)
              continue
            }

            if (!inventoryData) {
              console.warn(`No inventory found for product_id ${product_id}`)
              continue
            }

            // Update cost of good
            costOfGood = inventoryData?.cost_of_good || null

            const previousQuantity = inventoryData?.quantity || 0
            const newQuantity = Math.max(0, previousQuantity - valueToSubtractFromInventoryQuantity)

            const netChange = newQuantity - previousQuantity

            // Update the inventory changelog table
            await updateChangelogInWebhook(
              locals.supabase,
              previousQuantity,
              newQuantity,
              netChange,
              null, // imageUrl
              'login@enduristan.com',
              'Enduristan',
              shopifyOrder.name,
              'Enduristan Shopify',
              name,
              sku,
              product_id,
            )

            // Update the inventory quantity in the products table
            await updateProductQuantity(locals.supabase, newQuantity, product_id)
          }
        }

        const orderLineItem = {
          order_id,
          sku: sku,
          asin: null, // Shopify doesn't use ASINs
          product_name: name,
          image_url: null, // Shopify line items don't typically include image URLs
          product_id: productId,
          lot_number: null,
          expiration_date: null,
          quantity: quantity,
          unit_price: unitPrice,
          cost_of_good: costOfGood,
        }

        console.log('Order Line Item:', orderLineItem)
        orderLineItems.push(orderLineItem)
      }
    }

    console.log('All Order Line Items:', JSON.stringify(orderLineItems, null, 2))

    // Insert all order line items into the database
    if (orderLineItems.length > 0) {
      const { data: lineItemsData, error: lineItemsError } = await locals.supabase
        .from('order_line_items')
        .insert(orderLineItems)

      if (lineItemsError) {
        console.error('Error inserting order line items:', lineItemsError)
        return json({ error: 'Failed to process order line items' }, { status: 500 })
      }

      console.log('Order line items inserted successfully:', lineItemsData)
    }

    return json(
      {
        message: 'Order was created successfully in ShipStation and database',
        order_id: order_id,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Shopify → ShipStation webhook error:', error)
    return json({ error: error.message }, { status: 500 })
  }
}

// Handle CORS preflight requests
export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

// const shopifyOrder = {
//   id: 820982911946154508,
//   admin_graphql_api_id: 'gid://shopify/Order/820982911946154508',
//   app_id: null,
//   browser_ip: null,
//   buyer_accepts_marketing: true,
//   cancel_reason: 'customer',
//   cancelled_at: '2021-12-31T19:00:00-05:00',
//   cart_token: null,
//   checkout_id: null,
//   checkout_token: null,
//   client_details: null,
//   closed_at: null,
//   confirmation_number: null,
//   confirmed: false,
//   contact_email: 'jon@example.com',
//   created_at: '2021-12-31T19:00:00-05:00',
//   currency: 'USD',
//   current_shipping_price_set: {
//     shop_money: {
//       amount: '0.00',
//       currency_code: 'USD',
//     },
//     presentment_money: {
//       amount: '0.00',
//       currency_code: 'USD',
//     },
//   },
//   current_subtotal_price: '369.97',
//   current_subtotal_price_set: {
//     shop_money: {
//       amount: '369.97',
//       currency_code: 'USD',
//     },
//     presentment_money: {
//       amount: '369.97',
//       currency_code: 'USD',
//     },
//   },
//   current_total_additional_fees_set: null,
//   current_total_discounts: '0.00',
//   current_total_discounts_set: {
//     shop_money: {
//       amount: '0.00',
//       currency_code: 'USD',
//     },
//     presentment_money: {
//       amount: '0.00',
//       currency_code: 'USD',
//     },
//   },
//   current_total_duties_set: null,
//   current_total_price: '369.97',
//   current_total_price_set: {
//     shop_money: {
//       amount: '369.97',
//       currency_code: 'USD',
//     },
//     presentment_money: {
//       amount: '369.97',
//       currency_code: 'USD',
//     },
//   },
//   current_total_tax: '0.00',
//   current_total_tax_set: {
//     shop_money: {
//       amount: '0.00',
//       currency_code: 'USD',
//     },
//     presentment_money: {
//       amount: '0.00',
//       currency_code: 'USD',
//     },
//   },
//   customer_locale: 'en',
//   device_id: null,
//   discount_codes: [],
//   duties_included: false,
//   email: 'jon@example.com',
//   estimated_taxes: false,
//   financial_status: 'voided',
//   fulfillment_status: null,
//   landing_site: null,
//   landing_site_ref: null,
//   location_id: null,
//   merchant_business_entity_id: 'MTU0ODM4MDAwOQ',
//   merchant_of_record_app_id: null,
//   name: '#9999',
//   note: null,
//   note_attributes: [],
//   number: 234,
//   order_number: 1234,
//   order_status_url:
//     'https://jsmith.myshopify.com/548380009/orders/123456abcd/authenticate?key=abcdefg',
//   original_total_additional_fees_set: null,
//   original_total_duties_set: null,
//   payment_gateway_names: ['visa', 'bogus'],
//   phone: null,
//   po_number: null,
//   presentment_currency: 'USD',
//   processed_at: '2021-12-31T19:00:00-05:00',
//   reference: null,
//   referring_site: null,
//   source_identifier: null,
//   source_name: 'web',
//   source_url: null,
//   subtotal_price: '359.97',
//   subtotal_price_set: {
//     shop_money: {
//       amount: '359.97',
//       currency_code: 'USD',
//     },
//     presentment_money: {
//       amount: '359.97',
//       currency_code: 'USD',
//     },
//   },
//   tags: 'tag1, tag2',
//   tax_exempt: false,
//   tax_lines: [],
//   taxes_included: false,
//   test: true,
//   token: '123456abcd',
//   total_cash_rounding_payment_adjustment_set: {
//     shop_money: {
//       amount: '0.00',
//       currency_code: 'USD',
//     },
//     presentment_money: {
//       amount: '0.00',
//       currency_code: 'USD',
//     },
//   },
//   total_cash_rounding_refund_adjustment_set: {
//     shop_money: {
//       amount: '0.00',
//       currency_code: 'USD',
//     },
//     presentment_money: {
//       amount: '0.00',
//       currency_code: 'USD',
//     },
//   },
//   total_discounts: '20.00',
//   total_discounts_set: {
//     shop_money: {
//       amount: '20.00',
//       currency_code: 'USD',
//     },
//     presentment_money: {
//       amount: '20.00',
//       currency_code: 'USD',
//     },
//   },
//   total_line_items_price: '369.97',
//   total_line_items_price_set: {
//     shop_money: {
//       amount: '369.97',
//       currency_code: 'USD',
//     },
//     presentment_money: {
//       amount: '369.97',
//       currency_code: 'USD',
//     },
//   },
//   total_outstanding: '369.97',
//   total_price: '359.97',
//   total_price_set: {
//     shop_money: {
//       amount: '359.97',
//       currency_code: 'USD',
//     },
//     presentment_money: {
//       amount: '359.97',
//       currency_code: 'USD',
//     },
//   },
//   total_shipping_price_set: {
//     shop_money: {
//       amount: '10.00',
//       currency_code: 'USD',
//     },
//     presentment_money: {
//       amount: '10.00',
//       currency_code: 'USD',
//     },
//   },
//   total_tax: '0.00',
//   total_tax_set: {
//     shop_money: {
//       amount: '0.00',
//       currency_code: 'USD',
//     },
//     presentment_money: {
//       amount: '0.00',
//       currency_code: 'USD',
//     },
//   },
//   total_tip_received: '0.00',
//   total_weight: 0,
//   updated_at: '2021-12-31T19:00:00-05:00',
//   user_id: null,
//   billing_address: {
//     first_name: 'Steve',
//     address1: '123 Shipping Street',
//     phone: '555-555-SHIP',
//     city: 'Shippington',
//     zip: '40003',
//     province: 'Kentucky',
//     country: 'United States',
//     last_name: 'Shipper',
//     address2: null,
//     company: 'Shipping Company',
//     latitude: null,
//     longitude: null,
//     name: 'Steve Shipper',
//     country_code: 'US',
//     province_code: 'KY',
//   },
//   customer: {
//     id: 115310627314723954,
//     email: 'john@example.com',
//     created_at: null,
//     updated_at: null,
//     first_name: 'John',
//     last_name: 'Smith',
//     state: 'disabled',
//     note: null,
//     verified_email: true,
//     multipass_identifier: null,
//     tax_exempt: false,
//     phone: null,
//     currency: 'USD',
//     tax_exemptions: [],
//     admin_graphql_api_id: 'gid://shopify/Customer/115310627314723954',
//     default_address: {
//       id: 715243470612851245,
//       customer_id: 115310627314723954,
//       first_name: null,
//       last_name: null,
//       company: null,
//       address1: '123 Elm St.',
//       address2: null,
//       city: 'Ottawa',
//       province: 'Ontario',
//       country: 'Canada',
//       zip: 'K2H7A8',
//       phone: '123-123-1234',
//       name: '',
//       province_code: 'ON',
//       country_code: 'CA',
//       country_name: 'Canada',
//       default: true,
//     },
//   },
//   discount_applications: [],
//   fulfillments: [],
//   line_items: [
//     {
//       id: 487817672276298554,
//       admin_graphql_api_id: 'gid://shopify/LineItem/487817672276298554',
//       attributed_staffs: [
//         {
//           id: 'gid://shopify/StaffMember/902541635',
//           quantity: 1,
//         },
//       ],
//       current_quantity: 1,
//       fulfillable_quantity: 1,
//       fulfillment_service: 'manual',
//       fulfillment_status: null,
//       gift_card: false,
//       grams: 100,
//       name: 'Aviator sunglasses',
//       price: '89.99',
//       price_set: {
//         shop_money: {
//           amount: '89.99',
//           currency_code: 'USD',
//         },
//         presentment_money: {
//           amount: '89.99',
//           currency_code: 'USD',
//         },
//       },
//       product_exists: true,
//       product_id: 788032119674292922,
//       properties: [],
//       quantity: 1,
//       requires_shipping: true,
//       sales_line_item_group_id: null,
//       sku: 'SKU2006-001',
//       taxable: true,
//       title: 'Aviator sunglasses',
//       total_discount: '0.00',
//       total_discount_set: {
//         shop_money: {
//           amount: '0.00',
//           currency_code: 'USD',
//         },
//         presentment_money: {
//           amount: '0.00',
//           currency_code: 'USD',
//         },
//       },
//       variant_id: null,
//       variant_inventory_management: null,
//       variant_title: null,
//       vendor: null,
//       tax_lines: [],
//       duties: [],
//       discount_allocations: [],
//     },
//     {
//       id: 976318377106520349,
//       admin_graphql_api_id: 'gid://shopify/LineItem/976318377106520349',
//       attributed_staffs: [],
//       current_quantity: 1,
//       fulfillable_quantity: 1,
//       fulfillment_service: 'manual',
//       fulfillment_status: null,
//       gift_card: false,
//       grams: 1000,
//       name: 'Mid-century lounger',
//       price: '159.99',
//       price_set: {
//         shop_money: {
//           amount: '159.99',
//           currency_code: 'USD',
//         },
//         presentment_money: {
//           amount: '159.99',
//           currency_code: 'USD',
//         },
//       },
//       product_exists: true,
//       product_id: 788032119674292922,
//       properties: [],
//       quantity: 1,
//       requires_shipping: true,
//       sales_line_item_group_id: 142831562,
//       sku: 'SKU2006-020',
//       taxable: true,
//       title: 'Mid-century lounger',
//       total_discount: '0.00',
//       total_discount_set: {
//         shop_money: {
//           amount: '0.00',
//           currency_code: 'USD',
//         },
//         presentment_money: {
//           amount: '0.00',
//           currency_code: 'USD',
//         },
//       },
//       variant_id: null,
//       variant_inventory_management: null,
//       variant_title: null,
//       vendor: null,
//       tax_lines: [],
//       duties: [],
//       discount_allocations: [],
//     },
//     {
//       id: 315789986012684393,
//       admin_graphql_api_id: 'gid://shopify/LineItem/315789986012684393',
//       attributed_staffs: [],
//       current_quantity: 1,
//       fulfillable_quantity: 1,
//       fulfillment_service: 'manual',
//       fulfillment_status: null,
//       gift_card: false,
//       grams: 500,
//       name: 'Coffee table',
//       price: '119.99',
//       price_set: {
//         shop_money: {
//           amount: '119.99',
//           currency_code: 'USD',
//         },
//         presentment_money: {
//           amount: '119.99',
//           currency_code: 'USD',
//         },
//       },
//       product_exists: true,
//       product_id: 788032119674292922,
//       properties: [],
//       quantity: 1,
//       requires_shipping: true,
//       sales_line_item_group_id: 142831562,
//       sku: 'SKU2006-035',
//       taxable: true,
//       title: 'Coffee table',
//       total_discount: '0.00',
//       total_discount_set: {
//         shop_money: {
//           amount: '0.00',
//           currency_code: 'USD',
//         },
//         presentment_money: {
//           amount: '0.00',
//           currency_code: 'USD',
//         },
//       },
//       variant_id: null,
//       variant_inventory_management: null,
//       variant_title: null,
//       vendor: null,
//       tax_lines: [],
//       duties: [],
//       discount_allocations: [],
//     },
//   ],
//   payment_terms: null,
//   refunds: [],
//   shipping_address: {
//     first_name: 'Steve',
//     address1: '123 Shipping Street',
//     phone: '555-555-SHIP',
//     city: 'Shippington',
//     zip: '40003',
//     province: 'Kentucky',
//     country: 'United States',
//     last_name: 'Shipper',
//     address2: null,
//     company: 'Shipping Company',
//     latitude: null,
//     longitude: null,
//     name: 'Steve Shipper',
//     country_code: 'US',
//     province_code: 'KY',
//   },
//   shipping_lines: [
//     {
//       id: 271878346596884015,
//       carrier_identifier: null,
//       code: null,
//       current_discounted_price_set: {
//         shop_money: {
//           amount: '0.00',
//           currency_code: 'USD',
//         },
//         presentment_money: {
//           amount: '0.00',
//           currency_code: 'USD',
//         },
//       },
//       discounted_price: '10.00',
//       discounted_price_set: {
//         shop_money: {
//           amount: '10.00',
//           currency_code: 'USD',
//         },
//         presentment_money: {
//           amount: '10.00',
//           currency_code: 'USD',
//         },
//       },
//       is_removed: false,
//       phone: null,
//       price: '10.00',
//       price_set: {
//         shop_money: {
//           amount: '10.00',
//           currency_code: 'USD',
//         },
//         presentment_money: {
//           amount: '10.00',
//           currency_code: 'USD',
//         },
//       },
//       requested_fulfillment_service_id: null,
//       source: 'shopify',
//       title: 'Generic Shipping',
//       tax_lines: [],
//       discount_allocations: [],
//     },
//   ],
//   returns: [],
// }
