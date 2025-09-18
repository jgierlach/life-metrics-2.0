import { json } from '@sveltejs/kit'

export async function PUT({ request, locals }) {
  try {
    const { brand_name, brand_id } = await request.json()

    if (!brand_name || !brand_id) {
      return json({ message: 'brand_name and brand_id are required' }, { status: 400 })
    }

    const row = { projected_po_quantity: 0 }

    const { data, error } = await locals.supabase
      .from('products')
      .update(row)
      .eq('brand_name', brand_name)
      .eq('brand_id', brand_id)
      .select()

    if (error) {
      console.error('Supabase editing product error', error)
      return json({
        status: 500,
        body: { message: 'Failed to edit product' },
      })
    }

    return json({
      status: 200,
      body: { message: 'Projected PO Quantity was set to 0' },
    })
  } catch (err) {
    console.error('Server error editing brand sku mapping', err)
    return json(
      { message: 'Error updating projected PO quantity', error: err?.message },
      { status: 500 },
    )
  }
}
