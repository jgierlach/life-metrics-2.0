<script>
  import { enhance } from '$app/forms'

  let { form = $bindable() } = $props()

  let isLoading = $state(false)

  let formSuccess = $derived(form?.success ?? false)
</script>

<svelte:head>
  <title>Set New Password</title>
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
      <h1 class="mb-4 text-center text-2xl font-bold">Create New Password</h1>
      <label class="mb-2 block">
        <input
          class="input input-bordered w-full bg-base-200"
          name="password"
          type="password"
          placeholder="Password"
          required
        />
      </label>
      <label class="mb-2 block">
        <input
          class="input input-bordered w-full bg-base-200"
          name="confirmPassword"
          type="password"
          placeholder="Confirm Your Password"
          required
        />
      </label>

      {#if form?.message}
        <p class="my-4 text-error">{form.message}</p>
      {/if}

      <button type="submit" class="btn btn-primary w-full" disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Reset Password'}
      </button>
    </form>
  </div>
{:else}
  <div class="flex flex-1 flex-col items-center justify-center">
    <!-- Email Confirmation Header -->
    <h1 class="animate-fade-in mt-14 text-center text-4xl font-bold">Password Reset</h1>
    <p class="mt-4 max-w-md text-center text-lg">
      We've reset your password. You can now log in with your new password. <a
        href="/login"
        class="link link-primary">Log in here</a
      >.
    </p>
  </div>
{/if}
