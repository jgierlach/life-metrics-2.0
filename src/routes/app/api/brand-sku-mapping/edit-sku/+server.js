import { json } from '@sveltejs/kit'

export async function PUT({ request, locals }) {
  try {
    const { id, brand_name, brand_id, sku, asin } = await request.json()

    const row = {
      brand_name,
      brand_id,
      sku,
      asin,
    }

    if (!brand_name || !brand_id || !sku || !asin) {
      return json({ message: 'Missing one or more of the required parameters.' }, { status: 400 })
    }

    const { data, error } = await locals.supabase
      .from('brand_sku_mapping')
      .update(row)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase editing brand sku mapping error', error)
      return json({
        status: 500,
        body: { message: 'Failed to edit brand sku mapping', error },
      })
    }

    return json({
      status: 200,
      body: { message: 'Brand sku map was edited' },
    })
  } catch (err) {
    console.error('Server error editing brand sku mapping', err)
    return json(
      { message: 'Error editing brand sku mapping', error: err?.message },
      { status: 500 },
    )
  }
}
