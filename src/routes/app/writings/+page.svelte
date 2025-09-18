<script>
  import { goto } from '$app/navigation'

  let { data } = $props()
  const { writings } = data

  let title = $state('Untitled')
  let writingDraft = $state('')

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
    <div class="mb-8 flex justify-center">
      <button onclick={createWriting} class="btn btn-primary btn-wide shadow-lg">
        New Writing
      </button>
    </div>
    <div class="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {#each writings as post}
        <a
          href={`/app/writings/${post.id}`}
          class="from-primary to-secondary card transform bg-gradient-to-r via-base-100 shadow-lg transition-transform duration-200 hover:scale-105 hover:shadow-2xl"
        >
          <div class="card-body flex flex-col justify-between rounded-lg bg-base-100 p-4">
            <h2 class="card-title text-lg font-bold">{post.title}</h2>
            <div class="card-actions mt-4 flex justify-end">
              <button class="text-primary btn btn-link btn-xs">Read more</button>
            </div>
          </div>
        </a>
      {/each}
    </div>
  </div>
</div>
