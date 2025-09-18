import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request, locals }) {
  try {
    const { id, content } = await request.json()
    const userId = locals.session?.user?.id

    if (!userId) {
      return json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (!id || typeof content !== 'string' || content.trim().length === 0) {
      return json(
        { message: 'Missing or invalid fields required to edit journal entry.' },
        { status: 400 },
      )
    }

    const row = { content: content.trim() }

    const { error } = await locals.supabase
      .from('journals')
      .update(row)
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error editing journal entry', error)
      return json({ message: 'Failed to edit journal entry' }, { status: 500 })
    }

    return json({
      status: 200,
      body: { message: 'Journal was edited' },
    })
  } catch (err) {
    console.error('Unexpected error editing journal entry:', err)
    return json({ message: 'Invalid request body' }, { status: 400 })
  }
}
