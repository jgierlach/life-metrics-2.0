import { json } from '@sveltejs/kit'

export async function POST({ request, locals }) {
  try {
    const {
      is_3pl_customer_product,
      image_url,
      brand_name,
      brand_id,
      name,
      sku,
      asin,
      b2b_price,
      price,
      cost_of_good,
      pending_quantity,
      quantity,
      projected_po_quantity,
      fba_fee,
      expiration_date,
      lot_number,
      upc_code,
      notes,
    } = await request.json()

    // Input validation
    if (!brand_name || !brand_id || !name || !sku) {
      return json({ message: 'Missing required fields.' }, { status: 400 })
    }

    const product = {
      is_3pl_customer_product,
      image_url,
      brand_name,
      brand_id,
      name,
      sku,
      asin,
      price,
      b2b_price,
      cost_of_good,
      pending_quantity,
      quantity,
      projected_po_quantity,
      fba_fee,
      expiration_date,
      lot_number,
      upc_code,
      notes,
    }

    // Insert data
    const { data, error } = await locals.supabase.from('products').insert([product]).select()

    // Handle Supabase errors
    if (error) {
      console.error('Supabase Insert Error:', error)
      return json({ message: 'Product creation failed.', error: error.message }, { status: 500 })
    }

    return json({ message: 'New product was created!', data }, { status: 201 })
  } catch (err) {
    console.error('Server Error:', err)
    return json({ message: 'Internal server error.' }, { status: 500 })
  }
}
