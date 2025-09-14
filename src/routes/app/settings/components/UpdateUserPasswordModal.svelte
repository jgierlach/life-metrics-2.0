<script>
  import { enhance } from '$app/forms'
  import { linear } from 'svelte/easing'
  import { fade } from 'svelte/transition'

  let { isOpen = $bindable(false), error = '', onClose = null } = $props()

  let password = $state('')
  let confirmPassword = $state('')
  let isLoading = $state(false)
  /**
   * @type {HTMLInputElement | null}
   */
  let passwordInputRef = $state(null)

  const handleClose = () => {
    isOpen = false
    password = ''
    confirmPassword = ''
    onClose?.()
  }

  $effect(() => {
    if (isOpen && passwordInputRef) {
      passwordInputRef.focus()
    }
  })
</script>

{#if isOpen}
  <div transition:fade={{ duration: 100, easing: linear }} class="modal modal-open">
    <div class="modal-box relative rounded-lg shadow-lg">
      <!-- Close Button -->
      <button
        onclick={handleClose}
        class="btn btn-circle btn-sm absolute right-2 top-2 hover:bg-neutral-content hover:text-neutral"
      >
        ✕
      </button>

      <!-- Modal Title -->
      <h1 class="text-primary mb-6 text-center text-2xl font-semibold">Update Password</h1>

      <!-- Form -->
      <form
        action="?/updateUserPassword"
        method="POST"
        use:enhance={() => {
          isLoading = true
          return async ({ update }) => {
            isLoading = false
            update()
          }
        }}
      >
        <!-- New Password Field -->
        <div class="form-control mb-5">
          <label class="text-primary label font-medium" for="password"> New Password </label>
          <input
            required
            class="focus:ring-primary input input-bordered rounded-md bg-base-200 focus:outline-none focus:ring-2"
            type="password"
            id="userPassword"
            name="userPassword"
            bind:value={password}
            bind:this={passwordInputRef}
            placeholder="Enter your new password"
          />
        </div>

        <!-- Confirm Password Field -->
        <div class="form-control mb-5">
          <label class="text-primary label font-medium" for="userConfirmPassword">
            Confirm Password
          </label>
          <input
            required
            class="focus:ring-primary input input-bordered rounded-md bg-base-200 focus:outline-none focus:ring-2"
            type="password"
            id="userConfirmPassword"
            name="userConfirmPassword"
            bind:value={confirmPassword}
            placeholder="Confirm your password"
          />
        </div>

        <!-- Password Match Message -->
        {#if error}
          <p class="text-center text-sm font-medium text-error">❌ {error}</p>
        {:else if password === confirmPassword && password?.length > 0}
          <p class="text-center text-sm font-medium text-success">✅ Passwords match!</p>
        {:else if password?.length > 0 && confirmPassword?.length > 0}
          <p class="text-center text-sm font-medium text-error">❌ Passwords do not match</p>
        {/if}

        <!-- Submit Button -->
        <div class="mt-6 flex justify-center">
          <button
            disabled={password !== confirmPassword || password.length === 0 || isLoading}
            class="btn btn-primary w-full transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
    <!-- Backdrop -->
    <button
      aria-label="backdrop close button"
      onclick={handleClose}
      class="modal-backdrop bg-black/30"
    ></button>
  </div>
{/if}
