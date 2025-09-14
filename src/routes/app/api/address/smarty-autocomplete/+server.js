import { json } from '@sveltejs/kit'
import { SMARTYSTREETS_AUTH_ID, SMARTYSTREETS_AUTH_TOKEN } from '$env/static/private'

/**
 * SmartyStreets US Address Autocomplete API endpoint
 * Provides address suggestions and validation for US domestic addresses
 */

/**
 * @typedef {Object} SuggestionResponse
 * @property {string} text - The display text for the suggestion
 * @property {string} street_line - The street address
 * @property {string} city - City name
 * @property {string} state - State abbreviation
 * @property {string} zipcode - ZIP code
 * @property {number} entries - Number of deliverable addresses
 */

/**
 * Handle autocomplete suggestions
 * @param {{ request: Request }} params
 */
export async function POST({ request }) {
  try {
    const { query, maxSuggestions = 10 } = await request.json()

    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return json({ suggestions: [] })
    }

    // Check for required environment variables
    if (!SMARTYSTREETS_AUTH_ID || !SMARTYSTREETS_AUTH_TOKEN) {
      console.error('SmartyStreets credentials not configured')
      return json({ error: 'Address service not configured' }, { status: 500 })
    }

    // Build SmartyStreets API URL
    const baseUrl = 'https://us-autocomplete-pro.api.smartystreets.com/suggest'
    const params = new URLSearchParams({
      'auth-id': SMARTYSTREETS_AUTH_ID,
      'auth-token': SMARTYSTREETS_AUTH_TOKEN,
      prefix: query.trim(),
      max_suggestions: maxSuggestions.toString(),
      prefer_ratio: '33', // Prefer geolocation-based results
    })

    // Make request to SmartyStreets
    const response = await fetch(`${baseUrl}?${params}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`SmartyStreets API error: ${response.status} ${response.statusText}`)
      return json({ error: 'Address service temporarily unavailable' }, { status: 503 })
    }

    const data = await response.json()

    // Transform the response to match our component's needs
    // Note: SmartyStreets Autocomplete API doesn't include ZIP codes
    const suggestions = (data.suggestions || []).map(
      /** @param {any} suggestion */ (suggestion) => ({
        id: `${suggestion.street_line}_${suggestion.city}_${suggestion.state}`,
        text: suggestion.text,
        streetLine: suggestion.street_line,
        city: suggestion.city,
        state: suggestion.state,
        entries: suggestion.entries,
      }),
    )

    return json({ suggestions })
  } catch (error) {
    console.error('SmartyStreets autocomplete error:', error)
    return json({ error: 'Failed to fetch address suggestions' }, { status: 500 })
  }
}
