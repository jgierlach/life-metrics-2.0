import { json } from '@sveltejs/kit'

export async function POST({ request, locals }) {
  const { content, user_id } = await request.json()

  const row = {
    content,
    user_id,
  }

  const { data, error } = await locals.supabase.from('journal').insert([row]).select()

  if (error) {
    console.error(error)
    return
  }

  return json({
    status: 200,
    body: { message: 'Entry created!' },
  })
}
