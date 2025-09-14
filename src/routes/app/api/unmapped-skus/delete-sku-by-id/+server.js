import { json } from '@sveltejs/kit'

export async function DELETE({ request, locals }) {
  try {
    const { id } = await request.json()

    if (!id) {
      return json({ message: 'Missing id in request body.' }, { status: 400 })
    }

    const { error: deleteError } = await locals.supabase.from('unmapped_skus').delete().eq('id', id)

    if (deleteError) {
      console.error('Supabase delete error:', deleteError)
      return json(
        {
          message: 'Unmapped Sku failed to delete failed to delte by id.',
          error: deleteError.message,
        },
        { status: 500 },
      )
    }

    return json({ message: 'Unmapped sku was deleted by id successfully' })
  } catch (err) {
    console.error('Unexpected error:', err)
    return json({ message: 'Internal server error.' }, { status: 500 })
  }
}
