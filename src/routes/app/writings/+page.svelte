<script>
  import { goto } from '$app/navigation'
  import { formatTimestamp } from '$lib/utils'

  let { data } = $props()
  const { writings } = data

  let title = $state('Untitled')
  let writingDraft = $state('')

  // UI state
  let query = $state('')
  let sortBy = $state('newest') // 'newest' | 'oldest' | 'title'

  /**
   * @param {string} text
   * @param {number} [maxLen=140]
   * @returns {string}
   */
  function getPreview(text, maxLen = 140) {
    const raw = (text || '')
      .replace(/[#*_`>~\-]+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    return raw.length > maxLen ? raw.slice(0, maxLen - 1) + '…' : raw
  }

  function getDisplayedWritings() {
    /** @type {any[]} */
    let list = Array.isArray(writings) ? [...writings] : []
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (p) =>
          (p.title || '').toLowerCase().includes(q) ||
          (p.writing_draft || '').toLowerCase().includes(q),
      )
    }
    if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    } else if (sortBy === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    return list
  }

  /** @param {MouseEvent} event */
  async function createWriting(event) {
    event.preventDefault()
    const response = await fetch('/app/api/writings/create-writing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        writing_draft: writingDraft,
      }),
    })
    if (response.ok) {
      const responseData = await response.json()
      goto(`/app/writings/${responseData.body.writing.id}`)
    } else {
      console.error('Failed to create writing')
      const errorData = await response.json()
      alert(`Failed to create writing: ${errorData.message}`)
    }
  }
</script>

<div class="flex justify-center p-4">
  <div class="mt-6 w-full max-w-6xl px-4">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">Writings</h1>
        <p class="text-sm text-base-content/60">
          {Array.isArray(writings) ? writings.length : 0} total
        </p>
      </div>
      <div class="flex justify-end">
        <button onclick={createWriting} class="btn btn-primary w-full shadow-lg sm:w-auto"
          >New Writing</button
        >
      </div>
    </div>

    {#if (Array.isArray(writings) ? writings.length : 0) === 0}
      <div
        class="mt-12 flex flex-col items-center justify-center rounded-xl border border-base-300 bg-base-200 p-12 text-center"
      >
        <h2 class="text-lg font-semibold">No writings yet</h2>
        <p class="mt-2 max-w-md text-base-content/70">
          Create your first writing to start capturing thoughts, notes, and ideas.
        </p>
        <button onclick={createWriting} class="btn btn-primary mt-6"
          >Create your first writing</button
        >
      </div>
    {:else}
      <div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div class="sm:col-span-2">
          <label class="input input-bordered flex w-full items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="h-5 w-5 opacity-60"
              ><path
                fill-rule="evenodd"
                d="M10.5 3.75a6.75 6.75 0 1 0 4.21 12.02l4.76 4.76a.75.75 0 1 0 1.06-1.06l-4.76-4.76A6.75 6.75 0 0 0 10.5 3.75Zm-5.25 6.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z"
                clip-rule="evenodd"
              /></svg
            >
            <input
              type="text"
              placeholder="Search writings..."
              class="grow"
              value={query}
              oninput={(e) => (query = e.currentTarget.value)}
            />
          </label>
        </div>
        <div>
          <select
            class="select select-bordered w-full"
            value={sortBy}
            onchange={(e) => (sortBy = e.currentTarget.value)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title">Title A–Z</option>
          </select>
        </div>
      </div>

      {#if getDisplayedWritings().length === 0}
        <div class="mt-8 rounded-xl border border-base-300 bg-base-200 p-10 text-center">
          <p class="text-base-content/70">
            No results for <span class="font-medium">"{query}"</span>.
          </p>
        </div>
      {:else}
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {#each getDisplayedWritings() as post}
            <a
              href={`/app/writings/${post.id}`}
              class="card h-full bg-base-100 shadow-md transition duration-200 hover:shadow-xl active:scale-[.98]"
            >
              <div class="card-body">
                <h3 class="card-title truncate text-lg font-semibold">
                  {post.title || 'Untitled'}
                </h3>
                <p class="mt-1 text-sm text-base-content/70">{getPreview(post.writing_draft)}</p>
                <div class="mt-4 flex items-center justify-between text-xs text-base-content/60">
                  <span>{formatTimestamp(post.created_at)}</span>
                  <span class="text-primary">Read</span>
                </div>
              </div>
            </a>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>
