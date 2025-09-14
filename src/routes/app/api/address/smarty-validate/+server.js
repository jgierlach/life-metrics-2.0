import { json } from '@sveltejs/kit'
import { SMARTYSTREETS_AUTH_ID, SMARTYSTREETS_AUTH_TOKEN } from '$env/static/private'

/**
 * SmartyStreets US Address Validation API endpoint
 * Validates and standardizes US domestic addresses before order submission
 */

/**
 * @typedef {Object} AddressInput
 * @property {string} street - Street address
 * @property {string} city - City name
 * @property {string} state - State abbreviation
 * @property {string} zipCode - ZIP code
 */

/**
 * @typedef {Object} ValidatedAddress
 * @property {boolean} isValid - Whether the address is deliverable
 * @property {string} deliveryLine1 - Standardized street address
 * @property {string} city - Standardized city name
 * @property {string} state - State abbreviation
 * @property {string} zipCode - ZIP+4 code
 * @property {string} deliveryPointBarcode - USPS barcode
 * @property {Object} analysis - Delivery analysis
 * @property {Object} components - Address components
 */

/**
 * Handle address validation
 * @param {{ request: Request }} params
 */
export async function POST({ request }) {
  try {
    const { street, city, state, zipCode } = await request.json()

    // Validate input
    if (!street || !city || !state) {
      return json({ error: 'Street, city, and state are required' }, { status: 400 })
    }

    // Check for required environment variables
    if (!SMARTYSTREETS_AUTH_ID || !SMARTYSTREETS_AUTH_TOKEN) {
      console.error('SmartyStreets credentials not configured')
      return json({ error: 'Address validation service not configured' }, { status: 500 })
    }

    // Build SmartyStreets API URL
    const baseUrl = 'https://us-street.api.smartystreets.com/street-address'
    const params = new URLSearchParams({
      'auth-id': SMARTYSTREETS_AUTH_ID,
      'auth-token': SMARTYSTREETS_AUTH_TOKEN,
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      ...(zipCode && { zipcode: zipCode.trim() }),
    })

    // Make request to SmartyStreets
    console.log('SmartyStreets validation URL:', `${baseUrl}?${params}`)

    const response = await fetch(`${baseUrl}?${params}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    console.log('SmartyStreets validation response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`SmartyStreets validation API error: ${response.status} ${response.statusText}`)
      console.error('Error response body:', errorText)
      return json({ error: 'Address validation service temporarily unavailable' }, { status: 503 })
    }

    const data = await response.json()
    console.log('SmartyStreets validation raw response:', JSON.stringify(data, null, 2))

    // Check if address was found
    if (!data || !Array.isArray(data) || data.length === 0) {
      return json({
        isValid: false,
        error: 'Address not found or not deliverable',
        suggestions: null,
      })
    }

    // Get the first (best) match
    const validatedAddress = data[0]
    const components = validatedAddress.components
    const analysis = validatedAddress.analysis

    // Check deliverability
    const isDeliverable =
      (analysis.dpv_match_code === 'Y' ||
        analysis.dpv_match_code === 'S' ||
        analysis.dpv_match_code === 'D') &&
      analysis.dpv_vacant === 'N'

    const result = {
      isValid: isDeliverable,
      deliveryLine1: validatedAddress.delivery_line_1,
      city: components.city_name,
      state: components.state_abbreviation,
      zipCode: `${components.zipcode}-${components.plus4_code}`,
      deliveryPointBarcode: validatedAddress.delivery_point_barcode,
      analysis: {
        dpvMatch: analysis.dpv_match_code === 'Y',
        dpvVacant: analysis.dpv_vacant === 'Y',
        active: analysis.active === 'Y',
        business: analysis.dpv_cmra === 'Y',
      },
      components: {
        primaryNumber: components.primary_number,
        streetName: components.street_name,
        streetSuffix: components.street_suffix,
        secondaryNumber: components.secondary_number,
        secondaryDesignator: components.secondary_designator,
        cityName: components.city_name,
        defaultCityName: components.default_city_name,
        stateAbbreviation: components.state_abbreviation,
        zipcode: components.zipcode,
        plus4Code: components.plus4_code,
      },
    }

    // Add warnings for common issues
    const warnings = []
    if (analysis.dpv_vacant === 'Y') {
      warnings.push('Address appears to be vacant')
    }
    if (analysis.dpv_cmra === 'Y') {
      warnings.push('Address is a commercial mail receiving agency')
    }
    if (!components.secondary_number && analysis.dpv_no_stat === 'Y') {
      warnings.push('Address may require apartment/suite number')
    }

    if (warnings.length > 0) {
      result.warnings = warnings
    }

    return json(result)
  } catch (error) {
    console.error('SmartyStreets validation error:', error)
    return json({ error: 'Failed to validate address' }, { status: 500 })
  }
}
