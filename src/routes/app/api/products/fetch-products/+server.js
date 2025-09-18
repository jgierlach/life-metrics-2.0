import { json } from '@sveltejs/kit'

export async function GET({ url, locals }) {
  try {
    const { data, error } = await locals.supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error)
      return json({
        status: 500,
        body: { message: 'Failed to fetch products' },
      })
    }

    return json({
      status: 200,
      body: data ?? [],
    })
  } catch (err) {
    console.error('Unexpected error fetching products:', err)
    return json({ status: 400, body: { message: 'Invalid request' } })
  }
}
