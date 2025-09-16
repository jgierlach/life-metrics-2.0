<script>
  import { fade } from 'svelte/transition'
  import { goto, invalidate, invalidateAll } from '$app/navigation'
  import { formatTimestamp } from '$lib/utils'
  import Loading from '$lib/components/Loading.svelte'
  import { marked } from 'marked'

  /** @typedef {{ id: string; created_at: string; content: string }} JournalEntry */

  const { data } = $props()
  let journal = $derived(data?.journal ?? [])
  let session = $derived(data?.session ?? null)

  let userId = $derived(session?.user?.id ?? '')

  let loading = $state(false)
  let entry = $state('')
  let showEntry = $state(true)

  function toggleShowEntry() {
    showEntry = !showEntry
    setTimeout(() => {
      showEntry = !showEntry
    }, 2000)
  }

  let entryToEdit = $state(/** @type {JournalEntry | null} */ (null))
  let entryEditContent = $state('')

  /** @param {JournalEntry} post */
  function toggleEdit(post) {
    if (entryToEdit && entryToEdit.id === post.id) {
      entryToEdit = null
    } else {
      entryEditContent = post.content
      entryToEdit = { ...post }
    }
  }

  /** @param {JournalEntry} post */
  async function editJournal(post) {
    loading = true
    const id = post.id
    const response = await fetch('/app/api/journal/edit-entry', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        user_id: userId,
        content: entryEditContent,
      }),
    })
    if (response.ok) {
      await invalidate('app:journal')
      toggleEdit(post)
      entryEditContent = ''
      loading = false
    } else {
      const errorData = await response.json()
      alert(`Failed to edit Journal: ${errorData.message}`)
    }
  }

  let entryToDelete = $state(/** @type {JournalEntry | null} */ (null))
  let showDeleteEntryModal = $state(false)

  /** @param {JournalEntry} post */
  function toggleDelete(post) {
    showDeleteEntryModal = !showDeleteEntryModal
    entryToDelete = post
  }

  /** @param {string} id  */
  async function deleteEntry(id) {
    loading = true
    const response = await fetch('/app/api/journal/delete-entry', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        user_id: userId,
      }),
    })
    if (response.ok) {
      await invalidate('app:journal')
      loading = false
    } else {
      const errorData = await response.json()
      alert(`Failed to delete Journal: ${errorData.message}`)
    }
    entryToDelete = null
    showDeleteEntryModal = false
  }

  async function createEntry() {
    loading = true
    const response = await fetch('/app/api/journal/create-entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: entry,
        user_id: userId,
      }),
    })
    if (response.ok) {
      goto('/app/#top')
      toggleShowEntry()
      await invalidate('app:journal')
      entry = ''
      loading = false
    } else {
      const errorData = await response.json()
      alert(`Failed to create Journal: ${errorData.message}`)
    }
  }
</script>

<Loading {loading} />

{#if showEntry}
  <div id="top" class="mb-6 mt-6 flex justify-center">
    <form
      onsubmit={(e) => {
        e.preventDefault()
        createEntry()
      }}
      class="card mx-3 w-full max-w-md bg-base-100"
    >
      <div class="card-body">
        <div class="mb-3 flex justify-center">
          <h1 class="card-title text-center">Journal Entry</h1>
        </div>
        <textarea
          bind:value={entry}
          placeholder="What's something you are grateful for? What's something you learned today? What have you been thinking about recently?"
          class="textarea textarea-bordered h-72 bg-base-200"
          style=""
          required
        ></textarea>
        <div class="mt-4 flex justify-center">
          <button type="submit" class="btn btn-outline btn-info">Post</button>
        </div>
      </div>
    </form>
  </div>
{:else}
  <div class="mt-4 flex justify-center">
    <div transition:fade={{ duration: 500 }}>
      <img src="/green-check-mark.png" class="h-32 w-32" alt="green check mark" />
    </div>
  </div>
{/if}

{#if !showEntry}
  <div class="mb-96"></div>
{/if}

{#each journal as entry}
  <div class="mt-6 flex justify-center">
    <div class="card mx-6 w-full max-w-lg bg-base-100 p-4">
      <div class="card-body flex items-center justify-between">
        <div class="flex-grow-0 text-center" style="flex-basis: 30%;">
          <p><strong>{formatTimestamp(entry.created_at)}</strong></p>
        </div>
        <div class="flex flex-grow justify-end space-x-2">
          <button
            onclick={() => toggleEdit(entry)}
            class="btn btn-sm"
            title="Edit"
            aria-label="Edit entry"
          >
            <i class="fas fa-edit fa-xs"></i>
          </button>
          <button
            onclick={() => toggleDelete(entry)}
            class="btn btn-error btn-sm"
            title="Delete"
            aria-label="Delete entry"
          >
            <i class="fas fa-trash-alt fa-xs"></i>
          </button>
        </div>
      </div>
      {#if entryToEdit && entryToEdit.id === entry.id}
        <textarea bind:value={entryEditContent} class="textarea textarea-bordered mt-2"></textarea>
        <div class="mt-5 flex justify-center">
          <button onclick={() => editJournal(entry)} class="btn btn-outline btn-info btn-sm"
            >Save</button
          >
        </div>
      {:else}
        <div class="prose mt-4" style="padding-left: 0.5rem; padding-right: 0.5rem;">
          {@html marked(entry.content)}
        </div>
      {/if}
    </div>
  </div>
{/each}

<!-- DELETE ENTRY MODAL BEGINS -->
<div class={showDeleteEntryModal ? 'modal modal-open' : 'modal'}>
  <div class="modal-box">
    <h1 class="text-center text-lg font-bold">Are you sure you want to delete this entry?</h1>
    <p class="entry-content py-4" style="white-space: pre-line;">
      {entryToDelete ? entryToDelete.content : ''}
    </p>
    <div class="flex justify-center">
      <button
        onclick={() => entryToDelete && deleteEntry(entryToDelete.id)}
        class="btn btn-error mt-4">Yes, Delete</button
      >
    </div>
  </div>
  <button
    type="button"
    onclick={() => (showDeleteEntryModal = false)}
    class="modal-backdrop"
    aria-label="Close modal"
  ></button>
</div>
<!-- DELETE ENTRY MODAL ENDS -->
