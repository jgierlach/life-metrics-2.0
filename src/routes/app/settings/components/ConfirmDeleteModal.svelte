<script>
  import { linear } from 'svelte/easing'
  import { fade } from 'svelte/transition'

  let { isOpen = $bindable(false), onClose = null } = $props()

  const handleClose = () => {
    isOpen = false
    onClose?.()
  }
</script>

{#if isOpen}
  <div transition:fade={{ duration: 200, easing: linear }} class="modal modal-open">
    <div class="modal-box relative rounded-lg shadow-lg">
      <!-- Close Button -->
      <button
        onclick={handleClose}
        class="hover:bg-neutral-focus btn btn-circle btn-sm absolute right-3 top-3 text-neutral-content"
        aria-label="Close"
      >
        ✕
      </button>

      <!-- Modal Content -->
      <div class="mt-4 text-center">
        <!-- Icon for Emphasis -->
        <div
          class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error bg-opacity-20 text-error"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v3m0 4h.01M5.64 5.64l12.72 12.72M18.36 5.64L5.64 18.36"
            />
          </svg>
        </div>

        <!-- Warning Headline -->
        <h1 class="mb-2 text-2xl font-semibold text-error">Delete Account?</h1>
        <p class="text-primary mb-6 px-4 text-sm">
          This action is <span class="font-semibold">irreversible</span>. Your data will be
          permanently deleted.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="mt-4 flex justify-center gap-4">
        <button
          onclick={handleClose}
          type="button"
          class="hover:bg-neutral-focus btn btn-ghost border border-neutral-content px-6 hover:text-white"
        >
          Cancel
        </button>
        <button class="btn btn-error px-6"> Yes, Delete </button>
      </div>
    </div>
    <!-- Backdrop -->
    <button
      aria-label="backdrop close button"
      onclick={handleClose}
      class="modal-backdrop bg-black/30"
    ></button>
  </div>
{/if}
