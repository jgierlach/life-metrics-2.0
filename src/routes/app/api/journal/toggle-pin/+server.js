import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request, locals }) {
  const { id, user_id, is_pinned } = await request.json()

  if (!id || !user_id || typeof is_pinned !== 'boolean') {
    return json({ message: 'Missing or invalid fields' }, { status: 400 })
  }

  const { error } = await locals.supabase
    .from('journal')
    .update({ is_pinned })
    .eq('id', id)
    .eq('user_id', user_id)

  if (error) {
    console.error(error)
    return json({ message: 'Failed to update pin' }, { status: 500 })
  }

  return json({ message: 'Pin updated' }, { status: 200 })
}
