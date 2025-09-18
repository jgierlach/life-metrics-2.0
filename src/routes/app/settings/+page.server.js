import { error } from '@sveltejs/kit'

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

  const { data: user, error: userError } = await supabase.from('users').select('*').eq('id', userId)

  if (userError) {
    console.log('Error fetching user:', userError)
    throw error(500, 'Failed to fetch user')
  }

  return {
    user,
    session: locals.session,
  }
}

// import { fail } from '@sveltejs/kit'

// export const actions = {
//   updateUserDetails: async ({ request, locals: { supabase } }) => {
//     const formData = await request.formData()

//     const name = formData.get('userName')?.toString() || ''
//     const email = formData.get('userEmail')?.toString() || ''
//     const phone = formData.get('userPhone')?.toString() || ''

//     /**
//      * @type {import('@supabase/supabase-js').UserAttributes}
//      */
//     const updatePayload = {
//       data: {},
//     }

//     if (name && updatePayload.data) {
//       updatePayload.data = { name }
//     }

//     if (email) {
//       updatePayload.email = email
//     }

//     if (phone) {
//       updatePayload.phone = phone
//     }

//     // Update name in supabase
//     const { error } = await supabase.auth.updateUser(updatePayload)

//     const responseData = {
//       userName: name,
//       userEmail: email,
//       userPhone: phone,
//     }

//     if (error) {
//       return fail(400, {
//         message: error.message ?? 'Failed to update name',
//         data: responseData,
//         success: false,
//       })
//     }

//     return {
//       success: true,
//       data: responseData,
//     }
//   },
//   updateUserPassword: async ({ request, locals: { supabase } }) => {
//     const formData = await request.formData()

//     const password = formData.get('userPassword')?.toString() || ''
//     const confirmPassword = formData.get('userConfirmPassword')?.toString() || ''

//     if (password === confirmPassword) {
//       return fail(400, {
//         message: 'Passwords do not match',
//         data: {
//           userPassword: true,
//         },
//         success: false,
//       })
//     }

//     // Update password in supabase
//     const { error } = await supabase.auth.updateUser({
//       password,
//     })

//     if (error) {
//       return fail(400, {
//         message: error.message ?? 'Failed to update password',
//         data: {
//           userPassword: true,
//         },
//         success: false,
//       })
//     }

//     return {
//       success: true,
//       data: {
//         userPassword: true,
//       },
//     }
//   },
// }
