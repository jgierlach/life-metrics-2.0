import { error } from '@sveltejs/kit'

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals }) {
  const { productId } = params
  const { supabase } = locals

  if (!productId) {
    throw error(400, 'Product id is required')
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (productError) {
    console.error('Failed to fetch product', productError)
    throw error(500, 'Failed to fetch product')
  }

  // Fetch all the product images for this product
  const { data: productImages, error: productImagesError } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('display_order')

  if (productImagesError) {
    console.error('Failed to fetch product images', productImagesError)
    throw error(500, 'Failed to fetch product images')
  }

  console.log('PRODUCT ON SERVER', product)

  return {
    product,
    productImages,
    session: locals.session,
  }
}
