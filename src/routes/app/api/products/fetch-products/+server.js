import { json } from '@sveltejs/kit'

export async function GET({ url, locals }) {
  const { data, error } = await locals.supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return json({
      status: 500,
      body: { message: 'Failed to fetch product sales', error },
    })
  }

  return json({
    status: 200,
    body: data,
  })
}
