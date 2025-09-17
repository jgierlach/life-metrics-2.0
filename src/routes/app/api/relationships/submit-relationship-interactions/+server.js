import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
  const userId = locals.session?.user?.id
  if (!userId) {
    return json({ message: 'Unauthorized' }, { status: 401 })
  }
  const { interactions } = await request.json()
  /** @type {any[]} */
  const rows = (interactions || []).map((/** @type {any} */ i) => ({ ...i, user_id: userId }))

  console.log('INTERACTIONS ON SERVER', rows)

  const { data, error } = await locals.supabase
    .from('relationship_interactions')
    .insert(rows)
    .select()

  if (error) {
    console.error(error)
    return json({ message: 'Error submitting interactions', error }, { status: 500 })
  }

  return json({
    status: 200,
    body: { message: 'Relationship interactions submitted!' },
  })
}
