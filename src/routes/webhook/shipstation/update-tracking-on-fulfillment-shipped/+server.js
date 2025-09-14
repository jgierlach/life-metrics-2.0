import { SHIPSTATION_API_KEY, SHIPSTATION_SECRET, SEND_GRID_API_KEY } from '$env/static/private'
import { json } from '@sveltejs/kit'
import { sendTrackingUpdateEmail } from '$lib/utils'

// Disable CSRF protection for this webhook route
export const config = {
  csrf: false,
}

export async function POST({ request, locals }) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*', // Allow requests from any origin
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    const event = await request.json()
    console.log('Webhook received On Fulfillment Event:', event)

    // Check if the event contains a resource_url
    if (!event.resource_url) {
      return json(
        { error: 'Invalid webhook payload: no resource_url provided' },
        { status: 400, headers },
      )
    }

    // Fetch order data from ShipStation using the resource_url
    const response = await fetch(event.resource_url, {
      headers: {
        Authorization: `Basic ${Buffer.from(SHIPSTATION_API_KEY + ':' + SHIPSTATION_SECRET).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch order data:', response.status, response.statusText)
      return json({ error: 'Failed to fetch order data' }, { status: 500, headers })
    }

    const { fulfillments } = await response.json()
    console.log('Fulfillments', JSON.stringify(fulfillments, null, 2))

    for (const fulfillment of fulfillments) {
      const { orderNumber, customerEmail, trackingNumber, carrierCode, fulfillmentFee, shipTo } =
        fulfillment

      console.log(
        'Order Number',
        orderNumber,
        'Customer Email',
        customerEmail,
        'Tracking Number',
        trackingNumber,
        'Carrier Code',
        carrierCode,
      )

      // Find the order in your database
      const { data: orderData, error: orderError } = await locals.supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .eq('status', 'Pending')

      console.log('Order Data payload', orderData)

      if (orderError) {
        console.error('Error finding order by order number:', orderError)
        continue
      }

      if (!orderData || orderData.length === 0) {
        console.log(`No pending order found for order number: ${orderNumber}`)
        continue
      }

      const brandId = orderData[0]?.brand_id
      const orderId = orderData[0]?.id
      const carrier = carrierCode
      const customerName = shipTo?.name
      const costOfShipment = fulfillmentFee

      console.log('BRAND ID', brandId)
      console.log('ORDER ID', orderId)

      // Update the order with the carrier, tracking number, and status
      const { error: updateError } = await locals.supabase
        .from('orders')
        .update({
          carrier,
          tracking_number: trackingNumber,
          status: 'Shipped',
          cost_of_shipment: costOfShipment,
        })
        .eq('id', orderId)

      if (updateError) {
        console.error('Error updating order carrier and tracking number:', updateError)
      } else {
        console.log('Order was successfully updated with carrier and tracking number.')
      }

      let notificationEmail = ''
      if (brandId === 'jen@bessiesbest.com') {
        notificationEmail = 'storageandfulfillment@hometown-industries.com'
      } else {
        notificationEmail = brandId
      }

      // await sendTrackingUpdateEmail(
      //   notificationEmail,
      //   orderNumber,
      //   carrier,
      //   trackingNumber,
      //   customerName,
      //   SEND_GRID_API_KEY,
      // )
    }

    return json({ success: true }, { headers })
  } catch (err) {
    console.error('Error processing webhook:', err)
    return json({ error: 'Invalid request' }, { status: 400, headers })
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

// const Fulfillments = [
//   {
//     "fulfillmentId": 38186502,
//     "orderId": 469546774,
//     "orderNumber": "SHIP-1726172778573-66119",
//     "userId": "5fbe9b59-115c-4486-9800-d895ffb2b0ec",
//     "customerEmail": "storageandfulfillment@hometown-industries.com",
//     "trackingNumber": "56556565565",
//     "createDate": "2024-09-12T13:29:18.3230000",
//     "shipDate": "2024-09-12T00:00:00.0000000",
//     "voidDate": null,
//     "deliveryDate": null,
//     "carrierCode": "Airtranss",
//     "sellerFillProviderId": null,
//     "sellerFillProviderName": null,
//     "fulfillmentProviderCode": null,
//     "fulfillmentServiceCode": null,
//     "fulfillmentFee": 0,
//     "voidRequested": false,
//     "voided": false,
//     "marketplaceNotified": false,
//     "notifyErrorMessage": null,
//     "shipTo": {
//       "name": "Amazon FBA",
//       "company": "AMAZON",
//       "street1": "5505 O ST",
//       "street2": "",
//       "street3": null,
//       "city": "LINCOLN",
//       "state": "NE",
//       "postalCode": "68510-2151",
//       "country": "US",
//       "phone": null,
//       "residential": null,
//       "addressVerified": null
//     }
//   }
// ]
