import fetch from 'node-fetch'
import { json } from '@sveltejs/kit'
import { SEND_GRID_API_KEY } from '$env/static/private'

// Utility function to generate CSV content from data
function generateCSV(data) {
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map((row) => Object.values(row).join(','))
  return [headers, ...rows].join('\n')
}

export async function POST({ request }) {
  try {
    const { brandContactEmail, subjectLine, emailText, ccArray, csvData } = await request.json()

    // Validate email address
    if (!brandContactEmail || !validateEmail(brandContactEmail)) {
      return json({
        status: 400,
        body: { message: 'Invalid recipient email address' },
      })
    }

    const endpoint = 'https://api.sendgrid.com/v3/mail/send'

    let data = {
      personalizations: [
        {
          to: [{ email: brandContactEmail }],
          subject: subjectLine,
          bcc: [
            {
              email: 'storageandfulfillment@hometown-industries.com',
            },
          ],
        },
      ],
      from: {
        email: 'storageandfulfillment@hometown-industries.com',
        name: 'Hometown Industries',
      },
      content: [{ type: 'text/html', value: emailText || '' }],
    }

    // Generate CSV from csvData and attach it
    if (csvData && csvData.length > 0) {
      const csvContent = generateCSV(csvData)
      const csvBase64 = Buffer.from(csvContent).toString('base64')

      data.attachments = [
        ...(data.attachments || []), // Keep existing attachments if any
        {
          content: csvBase64,
          filename: 'po-data.csv',
          type: 'text/csv',
          disposition: 'attachment',
        },
      ]
    }

    // If the cc array has any data in it add it to the payload
    if (ccArray && ccArray.length > 0) {
      // Validate CC emails
      data.personalizations[0].cc = ccArray.filter((item) => validateEmail(item.email))
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SEND_GRID_API_KEY}`,
      },
      body: JSON.stringify(data),
    })

    // Get detailed error information
    if (!response.ok) {
      const errorData = await response.text()
      console.error('SendGrid API Error:', response.status, errorData)

      return json({
        status: response.status,
        body: { message: `Email failed to send. Status: ${response.status}. ${errorData}` },
      })
    }

    return json({
      status: 200,
      body: { message: 'PO forecast email sent successfully!' },
    })
  } catch (error) {
    console.error('Server error:', error)
    return json({
      status: 500,
      body: { message: `Server error: ${error.message}` },
    })
  }
}

// Simple email validation helper
function validateEmail(email) {
  return email && email.includes('@') && email.includes('.')
}
