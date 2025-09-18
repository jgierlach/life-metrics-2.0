import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
  try {
    const { content } = await request.json()
    const userId = locals.session?.user?.id

    if (!userId) {
      return json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return json({ message: 'Missing content' }, { status: 400 })
    }

    const row = { content: content.trim(), user_id: userId }

    const { error } = await locals.supabase.from('journals').insert([row])

    if (error) {
      console.error('Error creating journal entry', error)
      return json({ message: 'Failed to create journal entry' }, { status: 500 })
    }

    return json({
      status: 200,
      body: { message: 'Entry created!' },
    })
  } catch (err) {
    console.error('Unexpected error creating journal entry:', err)
    return json({ message: 'Invalid request body' }, { status: 400 })
  }
}
