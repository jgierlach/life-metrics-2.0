<script>
  import { enhance } from '$app/forms'

  let { form = $bindable() } = $props()

  let isLoading = $state(false)

  let email = $state('')

  let formSuccess = $derived(form?.success ?? false)
</script>

<svelte:head>
  <title>Reset Password</title>
</svelte:head>

{#if !formSuccess}
  <div class="flex flex-1 flex-col items-center justify-center">
    <form
      method="post"
      class="ml-6 mr-6 mt-10 w-96 rounded-lg bg-base-100 p-6 shadow-xl"
      use:enhance={() => {
        isLoading = true
        return async ({ update }) => {
          isLoading = false
          update()
        }
      }}
    >
      <h1 class="mb-4 text-center text-2xl font-bold">Reset Password</h1>
      <label class="mb-2 block">
        <input
          class="input input-bordered w-full bg-base-200"
          name="email"
          type="email"
          bind:value={email}
          placeholder="Email"
          required
        />
      </label>

      {#if form?.message}
        <p class="my-4 text-error">{form.message}</p>
      {/if}

      <button type="submit" class="btn btn-primary w-full" disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Reset Password'}
      </button>

      <!-- Prompt for users to sign up -->
      <p class="text-md mt-4 text-center">
        Already have an account?
        <a href="/login" class="link link-primary">Log in here</a>.
      </p>
    </form>
  </div>
{:else}
  <div class="flex flex-1 flex-col items-center justify-center">
    <!-- Email Confirmation Header -->
    <h1 class="animate-fade-in mt-14 text-center text-4xl font-bold">Check Your Inbox</h1>
    <p class="mt-4 max-w-md text-center text-lg">
      We've sent a temporary login link to your email.
    </p>
  </div>
{/if}
