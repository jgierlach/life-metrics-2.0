import { json } from '@sveltejs/kit'

export async function DELETE({ request, locals }) {
  try {
    const { id } = await request.json()

    const userId = locals.session?.user?.id
    if (!userId) {
      return json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await locals.supabase
      .from('writings')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Supabase error deleting writing', error)
      return json(
        { message: 'Supabase error deleting writing', error: error?.message },
        { status: 500 },
      )
    }

    return json({
      status: 200,
      body: { message: 'Writing was deleted!' },
    })
  } catch (err) {
    console.error('Internal server error', err)
    return json({ message: 'Server error' }, { status: 500 })
  }
}
