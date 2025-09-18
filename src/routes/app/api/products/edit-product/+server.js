import { json } from '@sveltejs/kit'
// import { updateChangelogOnEditProduct } from '$lib/utils'

export async function PUT({ request, locals }) {
  try {
    const {
      id,
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
      quantity,
      pending_quantity,
      projected_po_quantity,
      fba_fee,
      expiration_date,
      lot_number,
      upc_code,
      notes,
    } = await request.json()

    if (!id) {
      return json({ message: 'id is required' }, { status: 400 })
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
      quantity,
      projected_po_quantity,
      pending_quantity,
      fba_fee,
      expiration_date,
      lot_number,
      upc_code,
      notes,
    }

    // Update inventory changelog if necessary
    // await updateChangelogOnEditProduct(
    //   locals.supabase,
    //   id,
    //   quantity,
    //   image_url,
    //   brand_id,
    //   brand_name,
    //   name,
    //   sku,
    // )

    const { data, error } = await locals.supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase editing product error', error)
      return json({
        status: 500,
        body: { message: 'Failed to edit product', error },
      })
    }

    return json({
      status: 200,
      body: { message: 'Product was edited' },
    })
  } catch (err) {
    console.error('Server error editing brand sku mapping', err)
    return json({ message: 'Error editing product', error: err?.message }, { status: 500 })
  }
}
