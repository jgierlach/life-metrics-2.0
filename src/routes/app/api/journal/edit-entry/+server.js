import { json } from '@sveltejs/kit'

export async function PUT({ request, locals }) {
  const { id, content, user_id } = await request.json()

  const row = {
    content,
  }

  const { data, error } = await locals.supabase
    .from('journal')
    .update(row)
    .eq('id', id)
    .eq('user_id', user_id)
    .select()

  if (error) {
    console.error(error)
  }

  return json({
    status: 200,
    body: { message: 'Journal was edited' },
  })
}
