import { json } from '@sveltejs/kit'

export async function DELETE({ request, locals }) {
  const { id, user_id } = await request.json()

  const { error } = await locals.supabase
    .from('journal')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id)

  if (error) {
    console.error(error)
  }

  return json({
    status: 200,
    body: { message: 'Entry was deleted!' },
  })
}
