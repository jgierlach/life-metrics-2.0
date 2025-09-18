import { json } from '@sveltejs/kit'

export async function PUT({ request, locals }) {
  try {
    const { id, title, writing_draft } = await request.json()

    const userId = locals.session?.user?.id
    if (!userId) {
      return json({ message: 'Unauthorized' }, { status: 401 })
    }

    const row = {
      title: title,
      writing_draft: writing_draft,
      last_updated: new Date().toISOString(),
    }

    const { data, error } = await locals.supabase
      .from('writings')
      .update(row)
      .eq('id', id)
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('Supabase error editing writing', error)
      return json(
        { message: 'Supabase error editing writing', error: error?.message },
        { status: 500 },
      )
    }

    return json({
      status: 200,
      body: { message: 'Writing was edited' },
    })
  } catch (err) {
    console.error('Internal server error:', err)
    return json({ message: 'Server error' }, { status: 500 })
  }
}
