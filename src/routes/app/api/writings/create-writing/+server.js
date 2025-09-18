import { json } from '@sveltejs/kit'

export async function POST({ request, locals }) {
  try {
    const { title, writing_draft } = await request.json()

    const userId = locals.session?.user?.id
    if (!userId) {
      return json({ message: 'Unauthorized' }, { status: 401 })
    }

    const row = {
      title,
      writing_draft,
      last_updated: new Date().toISOString(),
      user_id: userId,
    }

    const { data, error } = await locals.supabase.from('writings').insert([row]).select()

    if (error) {
      console.error('Supabase error creating new writing', error)
      return json(
        { message: 'Creating new writing failed', error: error?.message },
        { status: 500 },
      )
    }

    return json({
      status: 200,
      body: { message: 'Writing created!', writing: data[0] },
    })
  } catch (err) {
    console.error('Server error creating new writing', err)
    return json({ message: 'Internal server error.' }, { status: 500 })
  }
}
