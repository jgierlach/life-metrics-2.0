import { json, error } from '@sveltejs/kit'

export async function DELETE({ request, locals }) {
  try {
    const { id } = await request.json()

    if (!id) {
      throw error(400, 'Missing id in request body')
    }

    const { error: deleteError } = await locals.supabase
      .from('line_items_to_skip')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Supabase delete error:', deleteError)
      throw error(500, 'Failed to delete line item')
    }

    return json({ message: 'line item was deleted successfully' })
  } catch (err) {
    console.error('Unexpected error:', err)
    throw error(500, 'An unexpected error occurred')
  }
}
