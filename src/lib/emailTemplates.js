export const newOrderNotificationEmailTemplate = (
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
) => {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Order Received - Hometown Industries</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; padding: 40px 20px;">
          <tr>
              <td align="center">
                  <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                      <!-- Header -->
                      <tr>
                          <td style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); padding: 30px; text-align: center;">
                              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                  🎉 New Order Received
                              </h1>
                              <p style="margin: 8px 0 0 0; color: #dcfce7; font-size: 16px; font-weight: 400;">
                                  Your order has been successfully created
                              </p>
                          </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                          <td style="padding: 40px 30px;">
                              <!-- Order Number Banner -->
                              <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 30px; border-radius: 6px;">
                                  <h2 style="margin: 0; color: #1e293b; font-size: 18px; font-weight: 600;">
                                      Order Number: <span style="color: #3b82f6; font-family: 'Monaco', 'Menlo', monospace;">${order_number}</span>
                                  </h2>
                                  <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">
                                      Order successfully placed and is being processed
                                  </p>
                              </div>
                              
                              <!-- Order Details -->
                              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                                  <tr>
                                      <td style="padding: 15px 0; border-bottom: 1px solid #e2e8f0;">
                                          <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                              <tr>
                                                  <td style="width: 40px; vertical-align: top; padding-right: 15px;">
                                                      <div style="width: 32px; height: 32px; background-color: #fef3c7; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                                          <span style="color: #d97706; font-size: 16px;">🏷️</span>
                                                      </div>
                                                  </td>
                                                  <td style="vertical-align: top;">
                                                      <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 500;">Company Name</p>
                                                      <p style="margin: 2px 0 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${brand_name}</p>
                                                  </td>
                                              </tr>
                                          </table>
                                      </td>
                                  </tr>
                                  <tr>
                                      <td style="padding: 15px 0; border-bottom: 1px solid #e2e8f0;">
                                          <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                              <tr>
                                                  <td style="width: 40px; vertical-align: top; padding-right: 15px;">
                                                      <div style="width: 32px; height: 32px; background-color: #dbeafe; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                                          <span style="color: #3b82f6; font-size: 16px;">📦</span>
                                                      </div>
                                                  </td>
                                                  <td style="vertical-align: top;">
                                                      <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 500;">Order Type</p>
                                                      <p style="margin: 2px 0 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${order_type}</p>
                                                  </td>
                                              </tr>
                                          </table>
                                      </td>
                                  </tr>
                              </table>
                              
                              <!-- Customer Information Section -->
                              <div style="background-color: #f8fafc; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                                  <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 16px; font-weight: 600; display: flex; align-items: center;">
                                      <span style="margin-right: 8px;">👤</span> Customer Information
                                  </h3>
                                  
                                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                      <tr>
                                          <td style="padding-bottom: 15px;">
                                              <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 500;">Customer Name</p>
                                              <p style="margin: 2px 0 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${customer_name}</p>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td>
                                              <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 500;">Shipping Address</p>
                                              <div style="margin: 2px 0 0 0; color: #1e293b; font-size: 16px; line-height: 1.4;">
                                                  <p style="margin: 0; font-weight: 600;">${street1}</p>
                                                  <p style="margin: 2px 0 0 0;">${city}, ${state} ${postal_code}</p>
                                                  <p style="margin: 2px 0 0 0;">${country}</p>
                                              </div>
                                          </td>
                                      </tr>
                                  </table>
                              </div>
                              
                              <!-- CTA Button -->
                              <div style="text-align: center; margin: 30px 0;">
                                  <a href="https://3pl.hometown-industries.com/app/orders/${orderId}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                                      View Order Details
                                  </a>
                              </div>
                              
                              <!-- Footer Message -->
                              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; margin-top: 30px;">
                                  <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.5;">
                                      Need help? Contact us at 
                                      <a href="mailto:storageandfulfillment@hometown-industries.com" style="color: #3b82f6; text-decoration: none; font-weight: 500;">
                                          storageandfulfillment@hometown-industries.com
                                      </a>
                                  </p>
                              </div>
                              
                              <!-- Additional Information Section -->
                              <div style="background-color: #fef7cd; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; text-align: center; margin-top: 20px;">
                                  <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5; font-weight: 500;">
                                      📄 If there are any documents or files relevant to the shipment you just created please reply to this email and send them.
                                  </p>
                              </div>
                          </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                          <td style="background-color: #1e293b; padding: 25px; text-align: center;">
                              <p style="margin: 0; color: #94a3b8; font-size: 14px;">
                                  © ${new Date().getFullYear()} Hometown Industries • Storage & Fulfillment Services
                              </p>
                              <p style="margin: 8px 0 0 0; color: #64748b; font-size: 12px;">
                                  This email was sent regarding your order with Hometown Industries
                              </p>
                          </td>
                      </tr>
                  </table>
              </td>
          </tr>
      </table>
  </body>
  </html>`
}
