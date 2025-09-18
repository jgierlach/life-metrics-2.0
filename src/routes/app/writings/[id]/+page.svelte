<script>
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { marked } from 'marked'
  import Loading from '$lib/components/Loading.svelte'

  let { data } = $props()
  const { writing, session } = data

  $effect(() => {
    console.log('Writing', writing)
  })

  // Reactive variables for title and writingDraft and id
  let id = $state(writing?.id)
  let title = $state(writing?.title)
  let writingDraft = $state(writing?.writing_draft)

  // Reactive variable for edit mode
  let isEditMode = $state(false)

  let loading = $state(false)
  let autoSaveInterval = $state(0)

  // Function to toggle edit mode
  async function toggleEditMode() {
    if (isEditMode) {
      window.clearInterval(autoSaveInterval)
    } else {
      startAutoSave()
    }
    isEditMode = !isEditMode
  }

  let showDeleteWritingModal = $state(false)
  async function toggleDeleteWritingModal() {
    showDeleteWritingModal = !showDeleteWritingModal
  }

  let isSaved = $state(false)
  async function saveChanges() {
    const response = await fetch('/app/api/writings/edit-writing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        title,
        writing_draft: writingDraft,
      }),
    })
    if (response.ok) {
      console.log('WRITING SAVED')
      isSaved = true
      setTimeout(() => {
        isSaved = false
      }, 1000)
      toggleEditMode()
    } else {
      const errorData = await response.json()
      alert(`Failed to save writing changes: ${errorData.message}`)
    }
  }

  async function autoSaveChanges() {
    const response = await fetch('/app/api/writings/edit-writing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        title,
        writing_draft: writingDraft,
      }),
    })
    if (response.ok) {
      console.log('WRITING SAVED')
      isSaved = true
      setTimeout(() => {
        isSaved = false
      }, 1000)
    } else {
      const errorData = await response.json()
      alert(`Failed to save writing changes: ${errorData.message}`)
    }
  }

  async function deleteWriting() {
    loading = true
    const response = await fetch('/app/api/writings/delete-writing', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
      }),
    })
    if (response.ok) {
      goto('/app/writings')
      loading = false
    } else {
      const errorData = await response.json()
      alert(`Failed to delete Writing: ${errorData.message}`)
    }
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.ctrlKey) {
      switch (event.key) {
        case 's': // Control + S
          event.preventDefault() // Prevent the default browser action
          saveChanges()
          break
        case 'd': // Control + E
          event.preventDefault() // Prevent the default browser action
          toggleEditMode()
          break
      }
    }
  }

  function startAutoSave() {
    autoSaveInterval = window.setInterval(autoSaveChanges, 10000)
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown)

    if (isEditMode) {
      startAutoSave()
    }

    return () => {
      window.removeEventListener('keydown', handleKeydown)
      window.clearInterval(autoSaveInterval)
    }
  })
</script>

<Loading {loading} />

<!-- Navbar -->
<nav class="flex items-center justify-between bg-base-200 p-4">
  {#if isEditMode}
    <div class="flex-1 text-left">{!isSaved ? 'Saving...' : 'Saved!!!'}</div>
  {:else}
    <div class="flex-1 text-left"></div>
  {/if}
  <div class="flex-1 text-center">
    {#if isEditMode}
      <h1 class="text-3xl font-bold" contenteditable bind:textContent={title}></h1>
    {:else}
      <h1 class="text-3xl font-bold">{title}</h1>
    {/if}
  </div>
  <div class="flex-1 text-right">
    {#if isEditMode}
      <button class="btn btn-outline btn-primary btn-sm mr-2" onclick={saveChanges}> Save </button>
    {:else}
      <button class="btn btn-outline btn-secondary btn-sm mr-2" onclick={toggleEditMode}>
        Edit
      </button>
    {/if}
    <button class="btn btn-outline btn-error btn-sm" onclick={toggleDeleteWritingModal}
      >Delete</button
    >
  </div>
</nav>

<!-- Content -->
<div class="bg-base-200 p-6">
  {#if isEditMode}
    <div class="form-control px-2">
      <textarea
        class="h-full w-full resize-none border-none bg-transparent p-4 pl-64 pr-64 outline-none"
        bind:value={writingDraft}
      ></textarea>
    </div>
  {:else}
    <div class="flex justify-center">
      <div class="prose mt-4 px-2">
        {@html marked(writingDraft)}
      </div>
    </div>
  {/if}
</div>

<!-- DELETE WRITING MODAL BEGINS -->
<div class={`modal ${showDeleteWritingModal ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      onclick={() => (showDeleteWritingModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="text-center text-xl font-semibold">Are you sure you want to delete?</h1>
    <p class="mt-3 text-center text-lg">{title}</p>
    <div class="flex justify-center">
      <button onclick={deleteWriting} class="btn btn-error mt-5"> Yes, Delete </button>
    </div>
  </div>
</div>

<!-- DELETE WRITING MODAL ENDS -->

<style>
  .form-control {
    height: calc(100vh - 6rem); /* Adjust height based on navbar and padding */
  }

  h1[contenteditable] {
    outline: none; /* Remove the default outline when focused */
  }
</style>
