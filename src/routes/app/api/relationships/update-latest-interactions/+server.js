import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function POST({ locals }) {
  try {
    const supabase = locals.supabase
    const userId = locals.session?.user?.id
    if (!userId) {
      return json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Function to update a specific field for the latest interaction of a given type
    /**
     * @param {string} interactionType
     * @param {string} fieldName
     */
    const updateFields = async (interactionType, fieldName) => {
      try {
        // First, fetch all relationships
        const { data: relationships, error: relationshipsError } = await supabase
          .from('relationships')
          .select('id')
          .eq('user_id', userId)

        if (relationshipsError) {
          console.error(`Failed to retrieve relationships: ${relationshipsError.message}`)
          return {
            success: false,
            error: `Failed to retrieve relationships: ${relationshipsError.message}`,
          }
        }

        // For each relationship, fetch the latest interaction of the given type
        for (const relationship of relationships) {
          const { data: latestInteraction, error: interactionError } = await supabase
            .from('relationship_interactions')
            .select('date_of_interaction')
            .eq('user_id', userId)
            .eq('relationship_id', relationship.id)
            .eq('interaction_type', interactionType) // Ensure exact string match
            .order('date_of_interaction', { ascending: false })
            .limit(1) // Removed .single() to prevent "multiple rows" error

          if (interactionError) {
            console.error(
              `Failed to retrieve ${interactionType} interactions for relationship_id ${relationship.id}: ${interactionError.message}`,
            )
            continue // Skip to the next relationship if an error occurs
          }

          // Check if an interaction is found
          if (latestInteraction && latestInteraction.length > 0) {
            // If a latest interaction is found, update the relationships table
            const { error: updateError } = await supabase
              .from('relationships')
              .update({ [fieldName]: latestInteraction[0].date_of_interaction })
              .eq('id', relationship.id)
              .eq('user_id', userId)

            if (updateError) {
              console.error(
                `Failed to update ${fieldName} for relationship_id ${relationship.id}: ${updateError.message}`,
              )
            } else {
            }
          } else {
          }
        }

        return { success: true }
      } catch (/** @type {any} */ error) {
        console.error(`Unexpected error during ${interactionType} update:`, error)
        return {
          success: false,
          error: `Unexpected error during ${interactionType} update: ${error.message}`,
        }
      }
    }

    // Update for each interaction type
    const textUpdate = await updateFields('Text', 'date_of_last_text')
    const phoneCallUpdate = await updateFields('Call', 'date_of_last_phone_call')
    const inPersonUpdate = await updateFields('In Person', 'date_of_last_in_person')

    if (!textUpdate.success || !phoneCallUpdate.success || !inPersonUpdate.success) {
      return json({
        status: 500,
        message: 'One or more updates failed.',
        errors: { textUpdate, phoneCallUpdate, inPersonUpdate },
      })
    }

    // Success response
    return json({ status: 200, message: 'Successfully updated relationships' })
  } catch (err) {
    console.error('Unexpected error updating latest interactions:', err)
    return json({ status: 400, message: 'Invalid request' })
  }
}
