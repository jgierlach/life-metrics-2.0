import { json } from '@sveltejs/kit'

export async function GET({ url, locals }) {
  const startDate = url.searchParams.get('startDate')
  const endDate = url.searchParams.get('endDate')

  if (!startDate || !endDate) {
    return json({
      status: 400,
      body: { message: 'Missing startDate or endDate parameter' },
    })
  }

  const { data, error } = await locals.supabase.rpc('fetch_habit_completions_count', {
    start_date: new Date(startDate).toISOString(),
    end_date: new Date(endDate).toISOString(),
  })

  if (error) {
    console.error(error)
    return json({
      status: 500,
      body: { message: 'Failed to fetch completions count', error },
    })
  }

  return json({
    status: 200,
    body: data,
  })
}
