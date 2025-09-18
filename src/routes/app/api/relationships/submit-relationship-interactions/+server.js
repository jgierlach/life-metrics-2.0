import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
  try {
    const userId = locals.session?.user?.id
    if (!userId) {
      return json({ message: 'Unauthorized' }, { status: 401 })
    }
    const { interactions } = await request.json()
    if (!Array.isArray(interactions) || interactions.length === 0) {
      return json({ message: 'No interactions provided' }, { status: 400 })
    }
    /** @type {any[]} */
    const rows = (interactions || []).map((/** @type {any} */ i) => ({ ...i, user_id: userId }))

    const { error } = await locals.supabase.from('relationship_interactions').insert(rows)

    if (error) {
      console.error(error)
      return json({ message: 'Error submitting interactions' }, { status: 500 })
    }

    return json({
      status: 200,
      body: { message: 'Relationship interactions submitted!' },
    })
  } catch (err) {
    console.error('Unexpected error submitting interactions:', err)
    return json({ message: 'Invalid request body' }, { status: 400 })
  }
}
