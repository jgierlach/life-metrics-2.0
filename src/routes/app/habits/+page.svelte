<script>
  import { formatDate, formatGraphDate } from '$lib/utils.js'
  import { invalidateAll } from '$app/navigation'

  import Loading from '$lib/components/Loading.svelte'
  import HabitCompletionsCountBarGraph from '$lib/components/HabitCompletionsCountBarGraph.svelte'

  let { data } = $props()
  const habits = $derived(data.habits)
  const session = $derived(data.session)

  /**
   * @typedef {Object} Habit
   * @property {string} habit_id
   * @property {string} habit_name
   * @property {string} [description]
   * @property {string} [created_at]
   */

  // Create habit fields
  let habitName = $state('')
  let description = $state('')

  let showCreateHabit = $state(false)

  /** @param {SubmitEvent} event */
  async function createHabit(event) {
    event.preventDefault()
    const response = await fetch('/app/api/habits/createHabit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        habitName,
        description,
      }),
    })
    if (response.ok) {
      console.log('Habit added successfully')
      await invalidateAll()
      habitName = ''
      description = ''
      showCreateHabit = false
    } else {
      console.error('Failed to add habit')
      const errorData = await response.json()
      alert(`Failed to create habit: ${errorData.message}`)
    }
  }

  let showDeleteHabit = $state(false)
  /** @type {Partial<Habit>} */
  let habitToDelete = $state({})

  /** @param {string | undefined} habitId @param {string | undefined} createdAt */
  async function deleteHabit(habitId, createdAt) {
    if (!habitId || !createdAt) return
    const response = await fetch('/app/api/habits/deleteHabit', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        habitId,
        createdAt,
      }),
    })
    if (response.ok) {
      await invalidateAll()
      habitToDelete = {}
    } else {
      const errorData = await response.json()
      alert(`Failed to delete habit: ${errorData.message}`)
    }
    habitToDelete = {}
    showDeleteHabit = false
  }

  let showEditHabit = $state(false)
  /** @type {Partial<Habit>} */
  let habitToEdit = $state({})

  async function editHabit() {
    const habitId = habitToEdit.habit_id
    const createdAt = habitToEdit.created_at
    const response = await fetch('/app/api/habits/editHabit', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        habitId,
        createdAt,
        habitName,
        description,
      }),
    })
    if (response.ok) {
      await invalidateAll()
      showEditHabit = false
      habitToEdit = {}
      habitName = ''
      description = ''
    } else {
      const errorData = await response.json()
      alert(`Failed to edit habit: ${errorData.message}`)
    }
  }

  /** @type {Habit[]} */
  let habitsCompletedToday = $state([])

  /** @param {Habit} habit */
  const addCompletedHabit = (habit) => {
    const firstIndex = habitsCompletedToday.findIndex((item) => item.habit_id === habit.habit_id)
    if (firstIndex !== -1) {
      alert(
        "You've already added this habit. You cannot complete the same habit more than once in a day.",
      )
      return
    }
    habitsCompletedToday = [habit, ...habitsCompletedToday]
  }

  async function submitCompletedHabits() {
    const completions = habitsCompletedToday.map((habit) => {
      return { habit_id: habit.habit_id, date_completed: selectedDate }
    })
    const response = await fetch('/app/api/habits/submitCompletedHabits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        completions,
      }),
    })
    if (response.ok) {
      console.log('Habit completions submitted successfully')
      habitsCompletedToday = []
      await updateData()
    } else {
      console.error('Failed to submit habit completions')
      const errorData = await response.json()
      alert(`Failed to submit habit completions: ${errorData.message}`)
    }
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  let startDate = $state(formatDate(new Date(currentYear, currentMonth, 1)))
  let endDate = $state(formatDate(now))

  /** @type {Array<{habit_name: string; count: number}>} */
  let completionsCount = $state([])
  /** @type {string[]} */
  let monthsAndYears = $state([])

  async function getMonthsAndYears() {
    const firstCompletionYear = 2024
    const firstCompletionMonth = 3 // January (0-indexed)

    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()

    let months = []
    for (let year = firstCompletionYear; year <= currentYear; year++) {
      const startMonth = year === firstCompletionYear ? firstCompletionMonth : 0
      const endMonth = year === currentYear ? currentMonth : 11
      for (let month = startMonth; month <= endMonth; month++) {
        months.push(`${month + 1}/1/${year}`)
      }
    }
    return months
  }

  $effect(() => {
    if (monthsAndYears.length === 0) {
      void getMonthsAndYears().then((m) => {
        monthsAndYears = m
      })
    }
  })

  async function fetchCompletionsCount() {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates')
      return
    }

    const response = await fetch(
      `/app/api/habits/fetchHabitCompletionsCount?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    if (response.ok) {
      const data = await response.json()
      completionsCount = data.body
      console.log('COMPLETIONS COUNT', completionsCount)
    } else {
      const errorData = await response.json()
      alert(`Failed to fetch completions count: ${errorData.message}`)
    }
  }

  let loading = $state(false)

  async function updateData() {
    loading = true
    await fetchCompletionsCount()
    await fetchTodayCompletions()
    loading = false
  }

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

  /** @type {Array<{habit_name: string; count: number}>} */
  let completionsToday = $state([])
  // Fetch completions for today
  async function fetchTodayCompletions() {
    const today = formatDate(new Date())
    loading = true

    const response = await fetch(
      `/app/api/habits/fetchHabitCompletionsCount?startDate=${encodeURIComponent(today)}&endDate=${encodeURIComponent(today)}`,
    )

    if (response.ok) {
      const data = await response.json()
      completionsToday = data.body
      console.log('TODAYS COMPLETIONS', completionsToday)
    } else {
      completionsToday = [] // Fallback in case of failure
    }
    loading = false
  }

  let selectedDate = $state(formatDate(now))

  const dateToDisplay = $derived(
    selectedDate === formatDate(now) ? 'Today' : formatGraphDate(selectedDate),
  )

  $effect(() => {
    console.log('SELECTED DATE', selectedDate)
    console.log('dateToDisplay', dateToDisplay)
  })

  $effect(() => {
    void (async () => {
      await updateData()
      await fetchTodayCompletions()
    })()
  })
</script>

<Loading {loading} />

<!-- DISPLAY HABITS SECTION BEGINS -->
<div class="mb-3 mt-6 flex justify-center px-4">
  <div class="w-full max-w-3xl rounded-lg bg-base-100 p-5 shadow-md">
    <h1 class="mb-5 text-center text-2xl font-semibold">Habits</h1>
    <div class="mb-4 flex justify-center">
      <button onclick={() => (showCreateHabit = !showCreateHabit)} class="btn btn-outline btn-sm">
        Create Habit
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th class="hidden sm:table-cell">Habit Name</th>
            <th class="hidden sm:table-cell">Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each habits as habit}
            <tr class="flex flex-col sm:table-row">
              <td class="sm:table-cell">
                <span class="block text-lg font-bold sm:text-base sm:font-normal"
                  >{habit.habit_name}</span
                >
                <span class="text-sm sm:hidden">{habit.description}</span>
              </td>
              <td class="mt-4 hidden sm:table-cell">{habit.description}</td>
              <td class="mt-2 flex flex-col sm:mt-0 sm:flex-row sm:space-x-2">
                <button
                  onclick={() => {
                    showEditHabit = true
                    habitToEdit = habit
                    habitName = habit.habit_name
                    description = habit.description
                  }}
                  class="btn btn-outline btn-info btn-sm mb-2 sm:mb-0"
                >
                  Edit
                </button>
                <button
                  onclick={() => {
                    habitToDelete = habit
                    showDeleteHabit = true
                  }}
                  class="btn btn-outline btn-error btn-sm mb-2 sm:mb-0"
                >
                  Delete
                </button>
                <button
                  onclick={() => addCompletedHabit(habit)}
                  class="btn btn-outline btn-primary btn-sm"
                >
                  Select
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
<!-- DISPLAY HABITS SECTION ENDS -->

<!-- HABIT COMPLETED TODAY SECTION BEGINS -->
{#if habitsCompletedToday.length === 0}
  <div class="mt-6 flex justify-center px-4">
    <div class="w-full max-w-lg rounded-lg bg-base-100 p-5 shadow-md">
      <h1 class="mb-2 text-center text-2xl font-semibold">
        You Have Completed {completionsToday.length === 0 ? '0' : completionsToday.length} Habits Today
      </h1>
      <div class="mb-5 flex justify-center">
        {#if completionsToday.length === 0}
          <span class="text-4xl">😭</span>
        {:else}
          <span class="text-4xl">🥳</span>
        {/if}
      </div>
      <div class="flex justify-center">
        <ul>
          {#each completionsToday as habit}
            <li>{habit.habit_name} <i class="fas fa-check text-green-500"></i></li>
          {/each}
        </ul>
      </div>
    </div>
  </div>
{/if}
<!-- HABITS COMPLTED TODAY SECTION ENDS -->

<!-- HABIT SUBMISSION SECTION BEGINS -->
{#if habitsCompletedToday.length > 0}
  <div class="mt-6 flex justify-center px-4">
    <div class="w-full max-w-lg rounded-lg bg-base-100 p-5 shadow-md">
      <h1 class="text-center text-2xl font-semibold">Submit Habits Completed</h1>
      <h2 class="mb-4 text-center text-2xl font-semibold">{dateToDisplay}</h2>
      <div class="mb-4 flex justify-center">
        <button
          onclick={() => {
            habitsCompletedToday = []
          }}
          class="btn btn-outline btn-sm">Clear</button
        >
      </div>
      <div class="mb-4 flex justify-center">
        <div class="form-control">
          <label class="label" for="selectedDate">
            <span class="label-text">Select Date</span>
          </label>
          <input
            id="selectedDate"
            type="date"
            bind:value={selectedDate}
            class="input input-bordered"
          />
        </div>
      </div>
      <div class="flex justify-center">
        <ul>
          {#each habitsCompletedToday as habit}
            <li>{habit.habit_name} <i class="fas fa-check text-green-500"></i></li>
          {/each}
        </ul>
      </div>
      <div class="mt-4 flex justify-center">
        <button onclick={submitCompletedHabits} class="btn btn-info btn-sm">Submit</button>
      </div>
    </div>
  </div>
{/if}
<!-- HABIT SUBMISSION SECTION ENDS -->

<!-- DISPLAY COMPLETED HABITS SECTION BEGINS -->
<!-- Date Selection Section -->
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

{#if completionsCount.length > 0}
  <div class="mb-3 mt-5 flex justify-center px-4">
    <div class="w-full max-w-2xl rounded-lg bg-base-100 p-5 shadow-md">
      <h1 class="text-center text-2xl font-semibold">Habit Completions</h1>
      <h2 class="mb-5 mt-2 text-center text-lg">
        {formatGraphDate(startDate)} - {formatGraphDate(endDate)}
      </h2>
      <div class="flex justify-center">
        <HabitCompletionsCountBarGraph data={completionsCount} />
      </div>
    </div>
  </div>
{/if}
<!-- DISPLAY COMPLETED HABITS SECTION ENDS -->

<!-- CREATE HABIT MODAL BEGINS -->
<div class={`modal ${showCreateHabit ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      onclick={() => (showCreateHabit = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 text-center text-xl font-semibold">Create Habit</h1>
    <form onsubmit={createHabit}>
      <div class="form-control mb-4">
        <label class="label" for="habitName">Habit Name</label>
        <input
          required
          class="input input-bordered bg-base-200"
          type="text"
          id="habitName"
          bind:value={habitName}
          placeholder="Enter habit name"
        />
      </div>

      <div class="form-control mb-4">
        <label class="label" for="description">Description</label>
        <textarea
          required
          class="textarea textarea-bordered bg-base-200 placeholder:text-base"
          id="description"
          bind:value={description}
          placeholder="Describe the habit"
        ></textarea>
      </div>

      <div class="mt-4 flex justify-center">
        <button class="btn btn-primary" type="submit">Create Habit</button>
      </div>
    </form>
  </div>
</div>
<!-- CREATE HABIT MODAL ENDS -->

<!-- DELETE HABIT MODAL BEGINS -->
<div class={`modal ${showDeleteHabit ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      onclick={() => (showDeleteHabit = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 text-center text-xl font-semibold">
      Are you sure you want to delete {habitToDelete.habit_name}?
    </h1>
    <div class="flex justify-center">
      <button
        onclick={() => deleteHabit(habitToDelete.habit_id, habitToDelete.created_at)}
        class="btn btn-error"
      >
        Yes, Delete
      </button>
    </div>
  </div>
</div>
<!-- DELETE HABIT MODAL ENDS -->

<!-- EDIT HABIT MODAL BEGINS -->
<div class={`modal ${showEditHabit ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      onclick={() => (showEditHabit = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 text-center text-xl font-semibold">Edit Habit</h1>
    <form onsubmit={editHabit}>
      <div class="form-control mb-4">
        <label class="label" for="habitName">Habit Name</label>
        <input
          required
          class="input input-bordered bg-base-200"
          type="text"
          id="habitName"
          bind:value={habitName}
          placeholder="Enter habit name"
        />
      </div>

      <div class="form-control mb-4">
        <label class="label" for="description">Description</label>
        <textarea
          required
          class="textarea textarea-bordered bg-base-200 placeholder:text-base"
          id="description"
          bind:value={description}
          placeholder="Describe the habit"
        ></textarea>
      </div>

      <div class="mt-4 flex justify-center">
        <button class="btn btn-info" type="submit">Save</button>
      </div>
    </form>
  </div>
</div>
<!-- EDIT HABIT MODAL ENDS -->
