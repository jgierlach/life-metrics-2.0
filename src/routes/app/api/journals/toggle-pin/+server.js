import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request, locals }) {
  try {
    const { id, is_pinned } = await request.json()
    const userId = locals.session?.user?.id

    if (!userId) {
      return json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (!id || typeof is_pinned !== 'boolean') {
      return json({ message: 'Missing or invalid fields' }, { status: 400 })
    }

    const { error } = await locals.supabase
      .from('journals')
      .update({ is_pinned })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error(error)
      return json({ message: 'Failed to update pin' }, { status: 500 })
    }

    return json({ message: 'Pin updated' }, { status: 200 })
  } catch (err) {
    console.error('Unexpected error updating pin:', err)
    return json({ message: 'Invalid request body' }, { status: 400 })
  }
}
