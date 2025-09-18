<script>
  import { fade } from 'svelte/transition'
  import { goto, invalidate, invalidateAll } from '$app/navigation'
  import { formatTimestamp } from '$lib/utils'
  import Loading from '$lib/components/Loading.svelte'
  import { marked } from 'marked'
  import SuccessOverlay from '$lib/components/SuccessOverlay.svelte'

  /** @typedef {{ id: string; created_at: string; content: string; is_pinned?: boolean | null }} JournalEntry */

  const { data } = $props()
  let journals = $derived(data?.journals ?? [])

  let loading = $state(false)
  let entry = $state('')
  let showEntry = $state(true)
  let showCelebration = $state(false)

  // Safer markdown: disable image rendering and strip inline <img> tags
  marked.use({
    renderer: {
      /** @param {any} token */
      image(token) {
        return `<span class=\"opacity-60 italic\">(image)</span>`
      },
    },
  })

  /** @param {string} text */
  function renderMarkdown(text) {
    const withoutImgTags = String(text || '').replace(/<img\b[^>]*>/gi, '')
    return marked.parse(withoutImgTags)
  }

  function toggleShowEntry() {
    showEntry = !showEntry
    setTimeout(() => {
      showEntry = !showEntry
    }, 2000)
  }

  let journalToEdit = $state(/** @type {JournalEntry | null} */ (null))
  let journalToEditContent = $state('')

  /** @param {JournalEntry} post */
  function toggleEdit(post) {
    if (journalToEdit && journalToEdit.id === post.id) {
      journalToEdit = null
    } else {
      journalToEditContent = post.content
      journalToEdit = { ...post }
    }
  }

  /** @param {JournalEntry} post */
  async function editJournal(post) {
    loading = true
    const id = post.id
    const response = await fetch('/app/api/journals/edit-journal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        content: journalToEditContent,
      }),
    })
    if (response.ok) {
      await invalidateAll()
      toggleEdit(post)
      journalToEditContent = ''
      loading = false
    } else {
      const errorData = await response.json()
      alert(`Failed to edit Journal: ${errorData.message}`)
    }
  }

  let journalToDelete = $state(/** @type {JournalEntry | null} */ (null))
  let showDeleteJournalModal = $state(false)

  /** @param {JournalEntry} post */
  function toggleDelete(post) {
    showDeleteJournalModal = !showDeleteJournalModal
    journalToDelete = post
  }

  /** @param {string} id  */
  async function deleteJournal(id) {
    loading = true
    const response = await fetch('/app/api/journals/delete-journal', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
      }),
    })
    if (response.ok) {
      await invalidateAll()
      loading = false
    } else {
      const errorData = await response.json()
      alert(`Failed to delete Journals: ${errorData.message}`)
    }
    journalToDelete = null
    showDeleteJournalModal = false
  }

  async function createJournal() {
    const response = await fetch('/app/api/journals/create-journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: entry,
      }),
    })
    if (response.ok) {
      toggleShowEntry()
      showCelebration = true
      await invalidateAll()
      entry = ''
      setTimeout(() => {
        showCelebration = false
      }, 2600)
    } else {
      const errorData = await response.json()
      alert(`Failed to create Journal: ${errorData.message}`)
    }
  }

  /** @param {JournalEntry} post */
  async function togglePin(post) {
    const response = await fetch('/app/api/journals/toggle-pin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: post.id,
        is_pinned: !(post.is_pinned ?? false),
      }),
    })
    if (response.ok) {
      await invalidateAll()
    } else {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      alert(`Failed to toggle pin: ${errorData.message}`)
    }
  }
</script>

<Loading {loading} />

{#if showEntry}
  <div id="top" class="mb-6 mt-6 flex justify-center">
    <form
      onsubmit={(e) => {
        e.preventDefault()
        createJournal()
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
          <button type="submit" class="btn btn-outline btn-primary">Post</button>
        </div>
      </div>
    </form>
  </div>
{:else}
  <div class="mt-4 flex justify-center">
    <div transition:fade={{ duration: 500 }}></div>
  </div>
{/if}

{#if !showEntry}
  <div class="mb-96"></div>
{/if}

<!-- Success celebration overlay -->
<SuccessOverlay
  visible={showCelebration}
  message="Journal saved!"
  subtext="Nice work. Keep it going."
/>

{#each journals as journal}
  <div class="mt-6 flex justify-center">
    <div class="card mx-6 w-full max-w-lg bg-base-100 p-4">
      <div class="card-body">
        <div class="flex items-center justify-center gap-2">
          <button
            onclick={() => toggleEdit(journal)}
            class="btn btn-sm"
            title="Edit"
            aria-label="Edit journal"
          >
            <i class="fas fa-edit fa-xs"></i>
          </button>
          <button
            onclick={() => toggleDelete(journal)}
            class="btn btn-error btn-sm"
            title="Delete"
            aria-label="Delete journal"
          >
            <i class="fas fa-trash-alt fa-xs"></i>
          </button>
          <button
            onclick={() => togglePin(journal)}
            class="btn btn-ghost btn-sm"
            title={journal.is_pinned ? 'Unpin' : 'Pin'}
            aria-label={journal.is_pinned ? 'Unpin journal' : 'Pin journal'}
          >
            <i
              class={`fas ${journal.is_pinned ? 'fa-thumbtack rotate-12 text-warning' : 'fa-thumbtack text-base-content/60'}`}
            ></i>
          </button>
        </div>
        <div class="mt-2 text-center">
          <p class="font-semibold">{formatTimestamp(journal.created_at)}</p>
        </div>
      </div>
      {#if journalToEdit && journalToEdit.id === journal.id}
        <textarea bind:value={journalToEditContent} class="textarea textarea-bordered mt-2"
        ></textarea>
        <div class="mt-5 flex justify-center">
          <button onclick={() => editJournal(journal)} class="btn btn-outline btn-primary btn-sm"
            >Save</button
          >
        </div>
      {:else}
        <div class="journal-prose prose mt-4" style="padding-left: 0.5rem; padding-right: 0.5rem;">
          {@html renderMarkdown(journal.content)}
        </div>
      {/if}
    </div>
  </div>
{/each}

<!-- DELETE journal MODAL BEGINS -->
<div class={showDeleteJournalModal ? 'modal modal-open' : 'modal'}>
  <div class="modal-box">
    <button
      onclick={() => (showDeleteJournalModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="text-center text-lg font-bold">
      Are you sure you want to delete this journal entry?
    </h1>
    <div class="entry-content journal-prose prose py-4" style="white-space: pre-line;">
      {#if journalToDelete}
        {@html renderMarkdown(journalToDelete.content)}
      {/if}
    </div>
    <div class="flex justify-center">
      <button
        onclick={() => journalToDelete && deleteJournal(journalToDelete.id)}
        class="btn btn-error mt-4">Yes, Delete</button
      >
    </div>
  </div>
  <button
    type="button"
    onclick={() => (showDeleteJournalModal = false)}
    class="modal-backdrop"
    aria-label="Close modal"
  ></button>
</div>

<!-- DELETE ENTRY MODAL ENDS -->

<style>
  /* Wrap long URLs and unbroken text inside rendered markdown (scoped) */
  :global(.journal-prose) {
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  :global(.journal-prose a) {
    overflow-wrap: anywhere;
    word-break: break-all;
  }

  /* Preserve normal wrapping in code blocks */
  :global(.journal-prose code),
  :global(.journal-prose pre) {
    word-break: normal;
    overflow-wrap: normal;
  }
</style>
