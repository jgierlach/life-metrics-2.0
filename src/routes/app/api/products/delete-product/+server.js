import { json } from '@sveltejs/kit'

export async function DELETE({ request, locals }) {
  try {
    const { id } = await request.json()

    if (!id) {
      return json({ message: 'Missing id in request body' }, { status: 400 })
    }

    const { error: deleteError } = await locals.supabase.from('products').delete().eq('id', id)

    if (deleteError) {
      console.error('Supabase delete error:', deleteError)
      return json({ message: 'Failed to delete product' }, { status: 500 })
    }

    return json({ message: 'Product was deleted successfully' })
  } catch (err) {
    console.error('Unexpected error:', err)
    return json({ message: 'Invalid request' }, { status: 400 })
  }
}
