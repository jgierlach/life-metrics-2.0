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
    console.log('Webhook received On Shipped Event:', event)

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

    const { shipments } = await response.json()
    console.log('ON SHIPPED DATA', JSON.stringify(shipments, null, 2))

    for (const shipment of shipments) {
      const { orderNumber, trackingNumber, carrierCode, serviceCode, shipmentCost, shipTo } =
        shipment

      console.log(
        'Order Number',
        orderNumber,
        'Tracking Number',
        trackingNumber,
        'Carrier Code',
        carrierCode,
        'Service Code',
        serviceCode,
        'Shipment Cost',
        shipmentCost,
      )

      // Find the order in your database
      const { data: orderData, error: orderError } = await locals.supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .eq('status', 'Pending')

      console.log('Order Data payload', orderData)

      if (orderError) {
        console.error('Error finding brandId and orderId by order number')
      }

      const brandId = orderData[0]?.brand_id
      const orderId = orderData[0]?.id
      const carrier = serviceCode
      const customerName = shipTo?.name
      const costOfShipment = shipmentCost

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
        console.error('Error updating orders table carrier and tracking number:', updateError)
      } else {
        console.log('orders table were successfully updated with carrier and tracking number.')
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

// const response = {
//   "shipments": [
//     {
//       "shipmentId": 271726263,
//       "orderId": 470873934,
//       "orderKey": "SHIP-1726505556889-44646",
//       "userId": "9e236874-e1c0-4241-8f93-a8223072efd4",
//       "customerEmail": null,
//       "orderNumber": "SHIP-1726505556889-44646",
//       "createDate": "2024-09-17T10:51:14.5030000",
//       "shipDate": "2024-09-17",
//       "shipmentCost": 39.57,
//       "insuranceCost": 0,
//       "trackingNumber": "1Z1V152Y6827822533",
//       "isReturnLabel": false,
//       "batchNumber": null,
//       "carrierCode": "ups_walleted",
//       "serviceCode": "ups_standard_international",
//       "packageCode": "package",
//       "confirmation": null,
//       "warehouseId": 499995,
//       "voided": false,
//       "voidDate": null,
//       "marketplaceNotified": false,
//       "notifyErrorMessage": null,
//       "shipTo": {
//         "name": "NA",
//         "company": "YYC4 Amazon Canada Fulfillment Services, ULC",
//         "street1": "6635 106 Ave SE",
//         "street2": "",
//         "street3": null,
//         "city": "Calgary",
//         "state": "AB",
//         "postalCode": "T2C 5X1",
//         "country": "CA",
//         "phone": null,
//         "residential": null,
//         "addressVerified": null
//       },
//       "weight": {
//         "value": 384,
//         "units": "ounces",
//         "WeightUnits": 1
//       },
//       "dimensions": {
//         "units": "inches",
//         "length": 21,
//         "width": 7,
//         "height": 11
//       },
//       "insuranceOptions": {
//         "provider": null,
//         "insureShipment": false,
//         "insuredValue": 0
//       },
//       "advancedOptions": {
//         "billToParty": null,
//         "billToAccount": null,
//         "billToPostalCode": null,
//         "billToCountryCode": null,
//         "storeId": 518236
//       },
//       "shipmentItems": null,
//       "labelData": null,
//       "formData": null
//     }
//   ],
//   "total": 1,
//   "page": 1,
//   "pages": 1
// }

// Webhook received On Shipped Event: {
//   resource_url: 'https://ssapi.shipstation.com/shipments?batchId=144015674&includeShipmentItems=False',
//     resource_type: 'SHIP_NOTIFY'
// }
