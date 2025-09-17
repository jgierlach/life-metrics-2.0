<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'

  // Import components
  import Loading from '$lib/components/Loading.svelte'

  // SvelteKit utilities
  import { invalidateAll } from '$app/navigation'

  // Import utility functions
  import {
    convertDateForRelationshipSection,
    sortBirthdaysByUpcoming,
    formatDate,
    formatGraphDate,
    formatDateForTableView,
    isWithinNext7Days,
  } from '$lib/utils'

  const { data } = $props()
  /** @type {any[]} */
  const relationships = $derived(data.relationships)
  // const session = $derived(data.session)
  const userId = $derived(data?.session?.user?.id)

  // Execute onMount
  onMount(async () => {
    // Fire-and-forget update of latest interaction fields without blocking render
    fetch('/app/api/relationships/update-latest-interactions', { method: 'POST' })
      .then(() => invalidateAll())
      .catch(() => {})

    // After loading, check for upcoming birthdays and anniversaries
    /** @type {string[]} */
    const upcomingEvents = []

    relationships.forEach((relationship) => {
      if (relationship.birthday && isWithinNext7Days(relationship.birthday)) {
        upcomingEvents.push(
          `${relationship.name}'s birthday is on ${convertDateForRelationshipSection(relationship.birthday)}`,
        )
      }

      if (relationship.anniversary && isWithinNext7Days(relationship.anniversary)) {
        upcomingEvents.push(
          `${relationship.name}'s anniversary is on ${convertDateForRelationshipSection(relationship.anniversary)}`,
        )
      }
    })

    if (upcomingEvents.length > 0) {
      alert(`Upcoming events:\n\n${upcomingEvents.join('\n')}`)
    }
    // loading = false
  })

  /** @type {any[]} */
  let relationshipInteractionsByDay = $state(data.relationshipInteractionsByDay ?? [])

  /** @type {any[]} */
  const textInteractionsByDay = $derived(
    relationshipInteractionsByDay.filter(
      (relationship) => relationship.interaction_type === 'Text',
    ),
  )
  /** @type {any[]} */
  const phoneCallInteractonsByDay = $derived(
    relationshipInteractionsByDay.filter(
      (relationship) => relationship.interaction_type === 'Call',
    ),
  )
  /** @type {any[]} */
  const inPersonInteractionsByDay = $derived(
    relationshipInteractionsByDay.filter(
      (relationship) => relationship.interaction_type === 'In Person',
    ),
  )

  async function fetchRelationshipInteractionsByDay() {
    loading = true
    const params = new URLSearchParams()
    params.set('selectedDate', selectedDate)
    const response = await fetch(
      `/app/api/relationships/fetch-relationship-interactions-by-day?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
    if (response.ok) {
      const data = await response.json()
      relationshipInteractionsByDay = data.body
      console.log('relationshipInteractionsByDay', relationshipInteractionsByDay)
    } else {
      const errorData = await response.json()
      alert(`Failed to fetch relationship interactions by day ${errorData.message}`)
    }
    loading = false
  }

  // Component specific variables and business logic

  /** @type {any[]} */
  let relationshipInteractionsCount = $state(data.relationshipInteractionsCount ?? [])

  /** @type {any[]} */
  const relationShipInteractionsCountGreatestToLeast = $derived(
    [...relationshipInteractionsCount].sort(
      (a, b) => b.total_interactions_count - a.total_interactions_count,
    ),
  )

  // Fetch the relationship interactions count
  async function fetchRelationshipInteractionsCount() {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates')
      return
    }

    const response = await fetch(
      `/app/api/relationships/fetch-interactions-count?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    if (response.ok) {
      const data = await response.json()
      relationshipInteractionsCount = data.body
      console.log('INTERACTIONS COUNT', relationshipInteractionsCount)
    } else {
      const errorData = await response.json()
      alert(`Failed to fetch relationship interactions count: ${errorData.message}`)
    }
  }

  $effect(() => {
    console.log('RELATIONSHIP INTERACTIONS COUNT', relationshipInteractionsCount)
  })

  let loading = $state(false)

  // Relationship fields
  let name = $state('')
  let innerCircle = $state(false)
  let birthday = $state('')
  let phoneNumber = $state('')
  let address = $state('')
  let anniversary = $state(null)
  let lastText = $state(null)
  let lastPhoneCall = $state(null)
  let lastInPerson = $state(null)
  let notes = $state('')

  let showCreateRelationship = $state(false)

  /** @param {Event} event */
  async function createRelationship(event) {
    event.preventDefault()
    const response = await fetch('/app/api/relationships/create-relationship', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        inner_circle: innerCircle,
        phone_number: phoneNumber,
        address,
        birthday,
        anniversary,
        notes,
      }),
    })
    if (response.ok) {
      console.log('Relationship created successfully')
      await invalidateAll()
      resetFields()
      showCreateRelationship = false
    } else {
      console.error('Failed to create relationship')
      const errorData = await response.json()
      alert(`Failed to create relationship: ${errorData.message}`)
    }
  }

  let showEditRelationship = $state(false)
  /** @type {any} */
  let relationshipToEdit = $state({})

  async function editRelationship() {
    const id = relationshipToEdit.id
    const response = await fetch('/app/api/relationships/edit-relationship', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        name,
        inner_circle: innerCircle,
        phone_number: phoneNumber,
        address,
        birthday,
        anniversary,
        notes,
      }),
    })
    if (response.ok) {
      await invalidateAll()
      resetFields()
      showEditRelationship = false
      relationshipToEdit = {}
    } else {
      const errorData = await response.json()
      alert(`Failed to edit relationship: ${errorData.message}`)
    }
  }

  let showDeleteRelationship = $state(false)
  /** @type {any} */
  let relationshipToDelete = $state({})

  /** @param {string} id */
  async function deleteRelationship(id) {
    const response = await fetch('/app/api/relationships/delete-relationship', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
      }),
    })
    if (response.ok) {
      await invalidateAll()
      relationshipToDelete = {}
    } else {
      const errorData = await response.json()
      alert(`Failed to delete relationship: ${errorData.message}`)
    }
    relationshipToDelete = {}
    showDeleteRelationship = false
  }

  let showNotes = $state(false)
  /** @type {any} */
  let relationshipToShowNotes = $state({})

  /** @type {any[]} */
  const innerCircleRelationships = $derived(
    sortBirthdaysByUpcoming(relationships.filter((relationship) => relationship.inner_circle)),
  )

  /** @type {any[]} */
  const everyoneElse = $derived(
    sortBirthdaysByUpcoming(relationships.filter((relationship) => !relationship.inner_circle)),
  )

  /** @type {any[]} */
  const sortedRelationships = $derived(sortBirthdaysByUpcoming(relationships))

  const interactionTypes = ['Text', 'Call', 'In Person']

  /** @type {any[]} */
  let interactions = $state([])

  /** @param {any} interaction */
  function addInteraction(interaction) {
    console.log('INTERACTIONS IN ADD INTERACTION', interactions)
    const firstIndex = interactions.findIndex((relationship) => relationship.id === interaction.id)
    if (firstIndex !== -1) {
      alert("You've already added this person. You cannot add them twice.")
      return
    }
    const data = {
      relationship_name: interaction.name,
      relationship_id: interaction.id,
      interaction_type: '',
      date_of_interaction: '',
    }
    interactions = [data, ...interactions]
  }

  async function submitInteractions() {
    loading = true
    if (interactions[0]?.interaction_type === '') {
      alert('You must select an interaction type.')
      return
    }
    const response = await fetch('/app/api/relationships/submit-relationship-interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interactions,
      }),
    })
    if (response.ok) {
      console.log('interactions submitted successfully')
      interactions = []
    } else {
      console.error('Failed to submit relationship interactions')
      const errorData = await response.json()
      alert(`Failed to submit relationship interactions: ${errorData.message}`)
    }
    await invalidateAll()
    await fetchRelationshipInteractionsCount()
    await fetchRelationshipInteractionsByDay()
    loading = false
  }

  const now = new Date()
  let startDate = $state(data.startDate)
  let endDate = $state(data.endDate)

  let selectedDate = $state(data.selectedDate)

  async function yearToDate() {
    const now = new Date()
    const currentYear = now.getFullYear()
    startDate = formatDate(new Date(currentYear, 0, 1))
    endDate = formatDate(now)
    await updateData()
  }

  async function monthToDate() {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    startDate = formatDate(new Date(currentYear, currentMonth, 1))
    endDate = formatDate(now)
    await updateData()
  }

  async function updateData() {
    loading = true
    await fetchRelationshipInteractionsCount()
    await fetchRelationshipInteractionsByDay()
    loading = false
  }

  const dateToDisplay = $derived(
    selectedDate === formatDate(now) ? 'Today' : formatDateForTableView(selectedDate),
  )

  $effect(() => {
    console.log('Interactions', interactions)
  })

  function resetFields() {
    name = ''
    birthday = ''
    phoneNumber = ''
    address = ''
    anniversary = null
    lastText = null
    lastPhoneCall = null
    lastInPerson = null
    notes = ''
    innerCircle = false
  }

  function setFieldsToEdit() {
    name = relationshipToEdit?.name
    innerCircle = relationshipToEdit?.inner_circle
    phoneNumber = relationshipToEdit?.phone_number
    address = relationshipToEdit?.address
    birthday = relationshipToEdit?.birthday
    anniversary = relationshipToEdit?.anniversary
    lastText = relationshipToEdit?.date_of_last_text
    lastPhoneCall = relationshipToEdit?.date_of_last_phone_call
    lastInPerson = relationshipToEdit?.date_of_last_in_person
    notes = relationshipToEdit?.notes
  }

  let showEveryoneElse = $state(false)
</script>

<Loading {loading} />

<!-- DISPLAY INNER CIRCLE RELATIONSHIPS SECTION BEGINS -->
<div class="mb-3 mt-6 flex justify-center px-4">
  <div class="w-full max-w-5xl rounded-lg bg-base-100 p-5 shadow-md">
    <h1 class="text-center text-2xl font-semibold">Inner Circle</h1>
    <!-- Toggle switch for "Everyone Else" -->
    <div class="my-4 flex justify-center">
      <label class="flex cursor-pointer items-center space-x-3">
        <span class="text-lg font-semibold">Show Everyone Else</span>
        <input type="checkbox" bind:checked={showEveryoneElse} class="toggle toggle-primary" />
      </label>
    </div>
    <div class="mb-4 flex justify-center">
      <button
        onclick={() => {
          showCreateRelationship = !showCreateRelationship
          resetFields()
        }}
        class="btn btn-outline btn-sm">Create Relationship</button
      >
    </div>
    <div class="overflow-x-auto">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th class="hidden md:table-cell">Name</th>
            <th class="hidden md:table-cell">Birthday</th>
            <th class="hidden md:table-cell">Last Text</th>
            <th class="hidden md:table-cell">Last Phone Call</th>
            <th class="hidden md:table-cell">Last In Person</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each innerCircleRelationships as relationship}
            <tr class="flex flex-col md:table-row">
              <td class="md:table-cell">
                <span class="block text-lg font-bold md:hidden">{relationship.name}</span>
                <span class="hidden md:block">{relationship.name}</span>
              </td>
              <td class="hidden md:table-cell"
                >{convertDateForRelationshipSection(relationship.birthday)}</td
              >
              <td class="hidden md:table-cell">
                {relationship.date_of_last_text === null
                  ? 'Nothing recorded'
                  : formatDateForTableView(relationship.date_of_last_text)}
              </td>
              <td class="hidden md:table-cell">
                {relationship.date_of_last_phone_call === null
                  ? 'Nothing recorded'
                  : formatDateForTableView(relationship.date_of_last_phone_call)}
              </td>
              <td class="hidden md:table-cell">
                {relationship.date_of_last_in_person === null
                  ? 'Nothing recorded'
                  : formatDateForTableView(relationship.date_of_last_in_person)}
              </td>
              <td class="mt-2 flex flex-col md:mt-0 md:flex-row md:space-x-2">
                <div class="mb-2 block md:hidden">
                  <p>
                    <strong>Birthday:</strong>
                    {convertDateForRelationshipSection(relationship.birthday)}
                  </p>
                  <p>
                    <strong>Last Text:</strong>
                    {relationship.date_of_last_text === null
                      ? 'Nothing recorded'
                      : formatDateForTableView(relationship.date_of_last_text)}
                  </p>
                  <p>
                    <strong>Last Phone Call:</strong>
                    {relationship.date_of_last_phone_call === null
                      ? 'Nothing recorded'
                      : formatDateForTableView(relationship.date_of_last_phone_call)}
                  </p>
                  <p>
                    <strong>Last In Person:</strong>
                    {relationship.date_of_last_in_person === null
                      ? 'Nothing recorded'
                      : formatDateForTableView(relationship.date_of_last_in_person)}
                  </p>
                </div>
                <button
                  onclick={() => {
                    showEditRelationship = true
                    relationshipToEdit = relationship
                    setFieldsToEdit()
                  }}
                  class="btn btn-outline btn-info btn-sm mb-2 md:mb-0">Edit</button
                >
                <button
                  onclick={() => {
                    relationshipToDelete = relationship
                    showDeleteRelationship = true
                  }}
                  class="btn btn-outline btn-error btn-sm mb-2 md:mb-0">Delete</button
                >
                <button
                  onclick={() => addInteraction(relationship)}
                  class="btn btn-outline btn-primary btn-sm mb-2 md:mb-0">Select</button
                >
                <button
                  onclick={() => {
                    relationshipToShowNotes = relationship
                    showNotes = true
                  }}
                  class="btn btn-outline btn-sm">View Notes</button
                >
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
<!-- DISPLAY INNER CIRCLE RELATIONSHIPS SECTION ENDS -->

{#if showEveryoneElse}
  <!-- DISPLAY EVERYONE ELSE SECTION BEGINS -->
  <div class="mb-3 mt-6 flex justify-center px-4">
    <div class="w-full max-w-5xl rounded-lg bg-base-100 p-5 shadow-md">
      <h1 class="mb-5 text-center text-2xl font-semibold">Everyone Else</h1>
      <div class="overflow-x-auto">
        <table class="table table-zebra w-full">
          <thead>
            <tr>
              <th class="hidden md:table-cell">Name</th>
              <th class="hidden md:table-cell">Birthday</th>
              <th class="hidden md:table-cell">Last Text</th>
              <th class="hidden md:table-cell">Last Phone Call</th>
              <th class="hidden md:table-cell">Last In Person</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each everyoneElse as relationship}
              <tr class="flex flex-col md:table-row">
                <td class="md:table-cell">
                  <span class="block text-lg font-bold md:hidden">{relationship.name}</span>
                  <span class="hidden md:block">{relationship.name}</span>
                </td>
                <td class="hidden md:table-cell"
                  >{convertDateForRelationshipSection(relationship.birthday)}</td
                >
                <td class="hidden md:table-cell">
                  {relationship.date_of_last_text === null
                    ? 'Nothing recorded'
                    : formatDateForTableView(relationship.date_of_last_text)}
                </td>
                <td class="hidden md:table-cell">
                  {relationship.date_of_last_phone_call === null
                    ? 'Nothing recorded'
                    : formatDateForTableView(relationship.date_of_last_phone_call)}
                </td>
                <td class="hidden md:table-cell">
                  {relationship.date_of_last_in_person === null
                    ? 'Nothing recorded'
                    : formatDateForTableView(relationship.date_of_last_in_person)}
                </td>
                <td class="mt-2 flex flex-col md:mt-0 md:flex-row md:space-x-2">
                  <div class="mb-2 block md:hidden">
                    <p>
                      <strong>Birthday:</strong>
                      {convertDateForRelationshipSection(relationship.birthday)}
                    </p>
                    <p>
                      <strong>Last Text:</strong>
                      {relationship.date_of_last_text === null
                        ? 'Nothing recorded'
                        : formatDateForTableView(relationship.date_of_last_text)}
                    </p>
                    <p>
                      <strong>Last Phone Call:</strong>
                      {relationship.date_of_last_phone_call === null
                        ? 'Nothing recorded'
                        : formatDateForTableView(relationship.date_of_last_phone_call)}
                    </p>
                    <p>
                      <strong>Last In Person:</strong>
                      {relationship.date_of_last_in_person === null
                        ? 'Nothing recorded'
                        : formatDateForTableView(relationship.date_of_last_in_person)}
                    </p>
                  </div>
                  <button
                    onclick={() => {
                      showEditRelationship = true
                      relationshipToEdit = relationship
                      setFieldsToEdit()
                    }}
                    class="btn btn-outline btn-info btn-sm mb-2 md:mb-0">Edit</button
                  >
                  <button
                    onclick={() => {
                      relationshipToDelete = relationship
                      showDeleteRelationship = true
                    }}
                    class="btn btn-outline btn-error btn-sm mb-2 md:mb-0">Delete</button
                  >
                  <button
                    onclick={() => addInteraction(relationship)}
                    class="btn btn-outline btn-primary btn-sm mb-2 md:mb-0">Select</button
                  >
                  <button
                    onclick={() => {
                      relationshipToShowNotes = relationship
                      showNotes = true
                    }}
                    class="btn btn-outline btn-sm">View Notes</button
                  >
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <!-- DISPLAY EVERYONE ELSE SECTION ENDS -->
{/if}

<!-- RELATIONSHIP INTERACTIONS SECTION BEGINS -->
{#if interactions.length > 0}
  <div class="mt-6 flex justify-center px-4">
    <div class="w-full max-w-xl rounded-lg bg-base-100 p-5 shadow-md">
      <h1 class="text-center text-2xl font-semibold">Record Relationship Interactions</h1>
      <div class="mb-4 mt-3 flex justify-center">
        <button
          onclick={() => {
            interactions = []
          }}
          class="btn btn-outline btn-sm">Clear</button
        >
      </div>
      <div class="flex justify-center">
        <ul class="w-full space-y-4">
          {#each interactions as interaction}
            <table class="table w-full text-center shadow-md">
              <thead class="hidden md:table-header-group">
                <tr>
                  <th>Name</th>
                  <th>Interaction Type</th>
                  <th>Interaction Date</th>
                </tr>
              </thead>
              <tbody>
                <tr class="flex flex-col md:table-row">
                  <td class="md:table-cell">
                    <span class="block text-lg font-bold md:hidden"
                      >{interaction.relationship_name}</span
                    >
                    <span class="hidden md:block">{interaction.relationship_name}</span>
                  </td>
                  <td>
                    <div class="mb-2 block md:hidden">
                      <p><strong>Interaction Type:</strong></p>
                    </div>
                    <select
                      class="select select-bordered w-full"
                      bind:value={interaction.interaction_type}
                    >
                      <option value="" disabled>Select Interaction Type</option>
                      {#each interactionTypes as type}
                        <option value={type}>{type}</option>
                      {/each}
                    </select>
                  </td>
                  <td>
                    <div class="mb-2 block md:hidden">
                      <p><strong>Interaction Date:</strong></p>
                    </div>
                    <input
                      type="date"
                      required
                      bind:value={interaction.date_of_interaction}
                      class="input input-bordered w-full"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          {/each}
        </ul>
      </div>
      <div class="mt-4 flex justify-center">
        <button onclick={submitInteractions} class="btn btn-info btn-sm">Submit</button>
      </div>
    </div>
  </div>
{/if}
<!-- RELATIONSHIP INTERACTIONS SECTION ENDS -->

<!-- RELATIONSHIP INTERACTIONS THAT HAPPENED TODAY SECTION BEGINS -->
<div class="mt-6 flex justify-center">
  <div class="w-full max-w-sm rounded-lg bg-base-100 p-5 px-4 shadow-md">
    <h1 class="text-center text-2xl font-semibold">View Interactions By Day</h1>
    <div class="mb-4 flex justify-center">
      <div class="form-control mt-3">
        <input
          type="date"
          onchange={fetchRelationshipInteractionsByDay}
          bind:value={selectedDate}
          class="input input-bordered"
        />
      </div>
    </div>
    <h1 class="mb-2 text-center text-xl font-semibold">
      {relationshipInteractionsByDay.length} Interactions {dateToDisplay}
    </h1>
    <div class="flex justify-center">
      <div>
        {#if textInteractionsByDay.length > 0}
          <div class="mt-2">
            <h1 class="text-left text-xl font-semibold">You've texted...</h1>
            <ul class="list-disc pl-5">
              {#each textInteractionsByDay as interaction}
                <li>{interaction.relationship_name}</li>
              {/each}
            </ul>
          </div>
        {/if}
        {#if phoneCallInteractonsByDay.length > 0}
          <div class="mt-4">
            <h1 class="text-left text-xl font-semibold">Had phone calls with...</h1>
            <ul class="list-disc pl-5">
              {#each phoneCallInteractonsByDay as interaction}
                <li>{interaction.relationship_name}</li>
              {/each}
            </ul>
          </div>
        {/if}
        {#if inPersonInteractionsByDay.length > 0}
          <div class="mt-4">
            <h1 class="text-left text-xl font-semibold">Been in person with...</h1>
            <ul class="list-disc pl-5">
              {#each inPersonInteractionsByDay as interaction}
                <li>{interaction.relationship_name}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
<!-- RELATIONSHIP INTERACTIONS THAT HAPPENED TODAY SECTION ENDS -->

<!-- DATE SELECTION SECTION BEGINS -->
<div class="mt-6 flex flex-col items-center px-4">
  <div class="rounded-lg bg-base-100 p-4 shadow-md">
    <h1 class="text-center text-2xl font-semibold">Select Date Range</h1>
    <div class="flex items-center space-x-4">
      <div class="form-control">
        <label class="label" for="startDate">
          <span class="label-text">Start Date</span>
        </label>
        <input
          id="startDate"
          type="date"
          bind:value={startDate}
          class="input input-bordered"
          onchange={updateData}
        />
      </div>
      <div class="form-control">
        <label class="label" for="endDate">
          <span class="label-text">End Date</span>
        </label>
        <input
          id="endDate"
          type="date"
          bind:value={endDate}
          class="input input-bordered"
          onchange={updateData}
        />
      </div>
    </div>
    <div class="mt-5 flex items-center justify-center">
      <button onclick={yearToDate} class="btn btn-secondary btn-sm mr-3">Year To Date</button>
      <button onclick={monthToDate} class="btn btn-secondary btn-sm">Month To Date</button>
    </div>
  </div>
</div>
<!-- DATE SELECTION SECTION ENDS -->

<!-- RELATIONSHIP INTERACTIONS COUNT SECTION BEGINS -->
{#if relationShipInteractionsCountGreatestToLeast.length > 0}
  <div class="mb-3 mt-6 flex justify-center px-4">
    <div class="w-full max-w-4xl rounded-lg bg-base-100 p-5 shadow-md">
      <h1 class="text-center text-2xl font-semibold">Relationship Interactions Count</h1>
      <h2 class="mb-5 mt-2 text-center text-lg">
        {formatGraphDate(startDate)} - {formatGraphDate(endDate)}
      </h2>
      <div class="overflow-x-auto">
        <table class="table table-zebra w-full">
          <thead>
            <tr class="hidden md:table-row">
              <th>Name</th>
              <th>Number of Texts</th>
              <th>Number of Calls</th>
              <th>Number of In Person</th>
              <th>Total Interactions</th>
            </tr>
          </thead>
          <tbody>
            {#each relationShipInteractionsCountGreatestToLeast as relationship}
              <tr class="flex flex-col md:table-row">
                <td class="md:table-cell">
                  <span class="block text-lg font-bold md:hidden">{relationship.name}</span>
                  <span class="hidden md:block">{relationship.name}</span>
                </td>
                <td class="hidden md:table-cell">{relationship.total_texts}</td>
                <td class="hidden md:table-cell">{relationship.total_calls}</td>
                <td class="hidden md:table-cell">{relationship.total_in_person}</td>
                <td class="hidden md:table-cell">{relationship.total_interactions_count}</td>
                <td class="mb-2 md:hidden">
                  <p><strong>Number of Texts:</strong> {relationship.total_texts}</p>
                  <p><strong>Number of Calls:</strong> {relationship.total_calls}</p>
                  <p><strong>Number of In Person:</strong> {relationship.total_in_person}</p>
                  <p>
                    <strong>Total Interactions:</strong>
                    {relationship.total_interactions_count}
                  </p>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
{/if}
<!-- RELATIONSHIP INTERACTIONS COUNT SECTION END -->

<!-- CREATE Relationship MODAL BEGINS -->
<div class={`modal ${showCreateRelationship ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      onclick={() => (showCreateRelationship = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 text-center text-xl font-semibold">Create Relationship</h1>
    <form onsubmit={createRelationship}>
      <div class="form-control mb-4">
        <label class="label" for="name">Name (required)</label>
        <input
          required
          class="input input-bordered bg-base-200"
          type="text"
          id="name"
          bind:value={name}
          placeholder="Name"
        />
      </div>

      <div class="form-control mb-4">
        <label class="label" for="innerCircle">Inner Circle (required)</label>
        <select
          id="innerCircle"
          class="select select-bordered bg-base-200"
          bind:value={innerCircle}
        >
          <option value={true}>TRUE</option>
          <option value={false}>FALSE</option>
        </select>
      </div>

      <div class="form-control mb-4">
        <label class="label" for="phoneNumber">Phone Number (required)</label>
        <input
          required
          class="input input-bordered bg-base-200"
          type="tel"
          id="phoneNumber"
          bind:value={phoneNumber}
          placeholder="Phone Number"
        />
      </div>

      <div class="form-control mb-4">
        <label class="label" for="address">Address</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="address"
          bind:value={address}
          placeholder="Address"
        />
      </div>

      <div class="form-control mb-4">
        <label class="label" for="birthday">Birthday (required)</label>
        <input
          required
          class="input input-bordered bg-base-200"
          type="date"
          id="birthday"
          bind:value={birthday}
          placeholder="Enter birthday"
        />
      </div>

      <div class="form-control mb-4">
        <label class="label" for="anniversary">Anniversary</label>
        <input
          class="input input-bordered bg-base-200"
          type="date"
          id="anniversary"
          bind:value={anniversary}
          placeholder="Enter Anniversary"
        />
      </div>

      <div class="form-control mb-4">
        <label class="label" for="notes">Notes</label>
        <textarea
          class="textarea textarea-bordered bg-base-200 placeholder:text-base"
          id="notes"
          bind:value={notes}
          placeholder="Any special notes about this person"
        ></textarea>
      </div>

      <div class="mt-6 flex justify-center">
        <button class="btn btn-primary" type="submit">Create Relationship</button>
      </div>
    </form>
  </div>
</div>
<!-- CREATE Relationship MODAL ENDS -->

<!-- EDIT RELATIONSHIP MODAL BEGINS -->
<div class={`modal ${showEditRelationship ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      onclick={() => (showEditRelationship = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 text-center text-xl font-semibold">Edit Relationship</h1>
    <form onsubmit={editRelationship}>
      <div class="form-control mb-4">
        <label class="label" for="name">Name (required)</label>
        <input
          required
          class="input input-bordered bg-base-200"
          type="text"
          id="name"
          bind:value={name}
          placeholder="Name"
        />
      </div>

      <div class="form-control mb-4">
        <label class="label" for="innerCircle">Inner Circle (required)</label>
        <select
          id="innerCircle"
          class="select select-bordered bg-base-200"
          bind:value={innerCircle}
        >
          <option value={true}>TRUE</option>
          <option value={false}>FALSE</option>
        </select>
      </div>

      <div class="form-control mb-4">
        <label class="label" for="phoneNumber">Phone Number (required)</label>
        <input
          required
          class="input input-bordered bg-base-200"
          type="tel"
          id="phoneNumber"
          bind:value={phoneNumber}
          placeholder="Phone Number"
        />
      </div>

      <div class="form-control mb-4">
        <label class="label" for="address">Address</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="address"
          bind:value={address}
          placeholder="Address"
        />
      </div>

      <div class="form-control mb-4">
        <label class="label" for="birthday">Birthday (required)</label>
        <input
          required
          class="input input-bordered bg-base-200"
          type="date"
          id="birthday"
          bind:value={birthday}
          placeholder="Enter birthday"
        />
      </div>

      <div class="form-control mb-4">
        <label class="label" for="anniversary">Anniversary</label>
        <input
          class="input input-bordered bg-base-200"
          type="date"
          id="anniversary"
          bind:value={anniversary}
          placeholder="Enter Anniversary"
        />
      </div>

      <div class="form-control mb-4">
        <label class="label" for="notes">Notes</label>
        <textarea
          class="textarea textarea-bordered bg-base-200 placeholder:text-base"
          id="notes"
          bind:value={notes}
          placeholder="Any special notes about this person"
        ></textarea>
      </div>

      <div class="mt-6 flex justify-center">
        <button class="btn btn-primary" type="submit">Save</button>
      </div>
    </form>
  </div>
</div>
<!-- EDIT RELATIONSHIP MODAL ENDS -->

<!-- DELETE Relationship MODAL BEGINS -->
<div class={`modal ${showDeleteRelationship ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      onclick={() => (showDeleteRelationship = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 text-center text-xl font-semibold">
      Are you sure you want to delete {relationshipToDelete.name}?
    </h1>
    <div class="flex justify-center">
      <button onclick={() => deleteRelationship(relationshipToDelete.id)} class="btn btn-error">
        Yes, Delete
      </button>
    </div>
  </div>
</div>
<!-- DELETE Relationship MODAL ENDS -->

<!-- SHOW NOTES MODAL BEGINS -->
<div class={`modal ${showNotes ? 'modal-open' : ''}`}>
  <div class="modal-box relative max-w-lg p-6">
    <button
      onclick={() => (showNotes = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2"
    >
      ✕
    </button>

    <h1 class="mb-4 text-center text-2xl font-bold">
      Notes for {relationshipToShowNotes.name}
    </h1>

    <div class="space-y-4">
      <div>
        <div class="label font-semibold">Name</div>
        <p class="text-base">{relationshipToShowNotes.name}</p>
      </div>

      <div>
        <div class="label font-semibold">Phone Number</div>
        <p class="text-base">{relationshipToShowNotes.phone_number}</p>
      </div>

      <div>
        <div class="label font-semibold">Address</div>
        <p class="text-base">{relationshipToShowNotes.address}</p>
      </div>

      <div>
        <div class="label font-semibold">Birthday</div>
        <p class="text-base">
          {convertDateForRelationshipSection(relationshipToShowNotes.birthday)}
        </p>
      </div>

      <div>
        <div class="label font-semibold">Anniversary</div>
        <p class="text-base">
          {relationshipToShowNotes.anniversary === null
            ? 'Nothing recorded'
            : convertDateForRelationshipSection(relationshipToShowNotes.anniversary)}
        </p>
      </div>

      <div>
        <div class="label font-semibold">Date of Last Text</div>
        <p class="text-base">
          {relationshipToShowNotes.date_of_last_text === null
            ? 'Nothing recorded'
            : formatDateForTableView(relationshipToShowNotes.date_of_last_text)}
        </p>
      </div>

      <div>
        <div class="label font-semibold">Date of Last Phone Call</div>
        <p class="text-base">
          {relationshipToShowNotes.date_of_last_phone_call === null
            ? 'Nothing recorded'
            : formatDateForTableView(relationshipToShowNotes.date_of_last_phone_call)}
        </p>
      </div>

      <div>
        <div class="label font-semibold">Date of Last In Person</div>
        <p class="text-base">
          {relationshipToShowNotes.date_of_last_in_person === null
            ? 'Nothing recorded'
            : formatDateForTableView(relationshipToShowNotes.date_of_last_in_person)}
        </p>
      </div>

      <div>
        <div class="label font-semibold">Notes</div>
        <p class="text-base">{relationshipToShowNotes.notes}</p>
      </div>
    </div>
  </div>
</div>
<!-- SHOW NOTES MODAL ENDS -->
