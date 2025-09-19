import { error, fail, redirect } from '@sveltejs/kit'

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals, depends }) {
  const { supabase } = locals
  const session = locals.session
  if (!session) {
    throw error(401, 'Unauthorized')
  }
  const userId = session.user.id

  if (!userId) {
    throw error(400, 'User id is required')
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError) {
    console.log('Error fetching user:', userError)
    throw error(500, 'Failed to fetch user')
  }

  return {
    user,
    session: locals.session,
  }
}

/** @type {import('./$types').Actions} */
export const actions = {
  updateUserDetails: async (
    /** @type {Parameters<import('./$types').Actions['updateUserDetails']>[0]} */ {
      request,
      locals: { supabase, session },
    },
  ) => {
    const formData = await request.formData()

    const userId = session?.user?.id
    if (!userId) {
      throw error(401, 'Unauthorized')
    }

    const name = formData.get('userName')?.toString().trim()
    const email = formData.get('userEmail')?.toString().trim()
    const phoneRaw = formData.get('userPhone')?.toString().trim()
    const creditCardsUrl = formData.get('creditCardsUrl')?.toString().trim()
    const assetsUrl = formData.get('assetsUrl')?.toString().trim()
    const debtsUrl = formData.get('debtsUrl')?.toString().trim()
    const taxReturnsUrl = formData.get('taxReturnsUrl')?.toString().trim()
    const transactionsUrl = formData.get('transactionsUrl')?.toString().trim()
    const categoriesUrl = formData.get('categoriesUrl')?.toString().trim()

    /** @param {string | undefined} input */
    const normalizePhone = (input) => {
      if (!input) return ''
      const digitsOnly = input.replace(/\D/g, '')
      if (digitsOnly.length === 0) return ''
      if (digitsOnly.length === 10) return `+1${digitsOnly}`
      if (digitsOnly.length >= 11 && digitsOnly.length <= 15) return `+${digitsOnly}`
      return ''
    }

    const updates = /** @type {Record<string, string>} */ ({})
    if (typeof name === 'string' && name.length > 0) updates.name = name
    if (typeof phoneRaw === 'string') {
      const normalized = normalizePhone(phoneRaw)
      if (!normalized && phoneRaw) {
        return fail(400, { message: 'Please enter a valid phone number', success: false })
      }
      if (normalized) updates.phone_number = normalized
    }
    if (typeof creditCardsUrl === 'string') updates.credit_cards_url = creditCardsUrl
    if (typeof assetsUrl === 'string') updates.assets_url = assetsUrl
    if (typeof debtsUrl === 'string') updates.debts_url = debtsUrl
    if (typeof taxReturnsUrl === 'string') updates.tax_returns_url = taxReturnsUrl
    if (typeof transactionsUrl === 'string') updates.transactions_url = transactionsUrl
    if (typeof categoriesUrl === 'string') updates.categories_url = categoriesUrl

    if (Object.keys(updates).length > 0) {
      const { error: userUpdateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
      if (userUpdateError) {
        return fail(400, {
          message: userUpdateError.message ?? 'Failed to update user',
          success: false,
        })
      }
    }

    if (typeof email === 'string' && email.length > 0) {
      const { error: authErr } = await supabase.auth.updateUser({ email })
      if (authErr) {
        return fail(400, { message: authErr.message ?? 'Failed to update email', success: false })
      }
      const { error: mirrorErr } = await supabase.from('users').update({ email }).eq('id', userId)
      if (mirrorErr) {
        return fail(400, { message: mirrorErr.message ?? 'Failed to mirror email', success: false })
      }
    }

    return { success: true }
  },

  updateUserPassword: async (
    /** @type {Parameters<import('./$types').Actions['updateUserPassword']>[0]} */ {
      request,
      locals: { supabase, session },
    },
  ) => {
    const formData = await request.formData()
    const userId = session?.user?.id
    if (!userId) {
      throw error(401, 'Unauthorized')
    }

    const password = formData.get('userPassword')?.toString() || ''
    const confirmPassword = formData.get('userConfirmPassword')?.toString() || ''

    if (password !== confirmPassword) {
      return fail(400, {
        message: 'Passwords do not match',
        data: { userPassword: true },
        success: false,
      })
    }

    const { error: authError } = await supabase.auth.updateUser({ password })
    if (authError) {
      return fail(400, {
        message: authError.message ?? 'Failed to update password',
        data: { userPassword: true },
        success: false,
      })
    }

    await supabase.from('users').update({ password }).eq('id', userId)

    return { success: true, data: { userPassword: true } }
  },

  deleteAccount: async (
    /** @type {Parameters<import('./$types').Actions['deleteAccount']>[0]} */ { locals, fetch },
  ) => {
    const session = locals.session
    if (!session?.user?.id) {
      throw error(401, 'Unauthorized')
    }

    const res = await fetch('/app/api/users/delete-account', { method: 'POST' })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      return fail(400, { message: body?.message ?? 'Failed to delete account', success: false })
    }
    throw redirect(303, '/logout')
  },
}
