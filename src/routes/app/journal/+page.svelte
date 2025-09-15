<script>
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import { goto } from '$app/navigation'
  import { formatTimestamp } from '$lib/utils'
  import Loading from '$lib/components/Loading.svelte'
  import { marked } from 'marked'

  let { data } = $props()
  const { journal, session } = data

  $effect(() => {
    console.log(journal)
  })

  let loading = false
  let entry = ''
  let showEntry = true

  function toggleShowEntry() {
    showEntry = !showEntry
    setTimeout(() => {
      showEntry = !showEntry
    }, 2000)
  }

  let entryToEdit = {}
  let entryEditContent = ''

  function toggleEdit(post) {
    if (entryToEdit && entryToEdit.id === post.id) {
      entryToEdit = {}
    } else {
      entryEditContent = post.content
      entryToEdit = { ...post }
    }
  }

  async function editJournal(post) {
    loading = true
    const id = post.id
    const createdAt = post.created_at
    const response = await fetch('/app/api/journals/editJournal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        createdAt,
        content: entryEditContent,
      }),
    })

    if (response.ok) {
      loadJournal(data.supabase)
      toggleEdit(post)
      entryEditContent = ''
      loading = false
    } else {
      const errorData = await response.json()
      alert(`Failed to edit Journal: ${errorData.message}`)
    }
  }

  let entryToDelete = {}
  let showDeleteEntryModal = false

  function toggleDelete(post) {
    showDeleteEntryModal = !showDeleteEntryModal
    entryToDelete = post
  }

  async function deleteJournal(id, createdAt) {
    loading = true
    const response = await fetch('/app/api/journals/deleteJournal', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        createdAt,
      }),
    })
    if (response.ok) {
      loadJournal(data.supabase)
      loading = false
    } else {
      const errorData = await response.json()
      alert(`Failed to delete Journal: ${errorData.message}`)
    }
    entryToDelete = {}
    showDeleteEntryModal = false
  }

  async function handleSubmit(event) {
    event.preventDefault()
    loading = true
    const response = await fetch('/app/api/journals/createJournal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: entry,
      }),
    })
    if (response.ok) {
      goto('/app/#top')
      toggleShowEntry()
      loadJournal(data.supabase)
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
    <form on:submit|preventDefault={handleSubmit} class="card mx-3 w-full max-w-md bg-base-100">
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

{#each journal as post}
  <div class="mt-6 flex justify-center">
    <div class="card mx-6 w-full max-w-lg bg-base-100 p-4">
      <div class="card-body flex items-center justify-between">
        <div class="flex-grow-0 text-center" style="flex-basis: 30%;">
          <p><strong>{formatTimestamp(post.created_at)}</strong></p>
        </div>
        <div class="flex flex-grow justify-end space-x-2">
          <button on:click={() => toggleEdit(post)} class="btn btn-sm" title="Edit">
            <i class="fas fa-edit fa-xs"></i>
          </button>
          <button on:click={() => toggleDelete(post)} class="btn btn-error btn-sm" title="Delete">
            <i class="fas fa-trash-alt fa-xs"></i>
          </button>
        </div>
      </div>
      {#if entryToEdit && entryToEdit.id === post.id}
        <textarea bind:value={entryEditContent} class="textarea textarea-bordered mt-2"></textarea>
        <div class="mt-5 flex justify-center">
          <button on:click={() => editJournal(post)} class="btn btn-outline btn-info btn-sm"
            >Save</button
          >
        </div>
      {:else}
        <div class="prose mt-4" style="padding-left: 0.5rem; padding-right: 0.5rem;">
          {@html marked(post.content)}
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
      {entryToDelete.content}
    </p>
    <div class="flex justify-center">
      <button
        on:click={() => deleteJournal(entryToDelete.id, entryToDelete.created_at)}
        class="btn btn-error mt-4">Yes, Delete</button
      >
    </div>
  </div>
  <div on:click={() => (showDeleteEntryModal = false)} class="modal-backdrop" />
</div>
<!-- DELETE ENTRY MODAL ENDS -->
