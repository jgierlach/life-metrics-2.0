<script>
  import { enhance } from '$app/forms'

  let { form = $bindable() } = $props()

  let isLoading = $state(false)

  // Signup fields
  let name = $derived(form?.data?.name ?? '')
  let email = $derived(form?.data?.email ?? '')
  let showConfirmation = $derived(form?.showConfirmation ?? false)
</script>

<svelte:head>
  <title>Hometown Industries | 3PL Customer Sign Up</title>
</svelte:head>

{#if !showConfirmation}
  <div class="flex flex-1 flex-col items-center justify-center">
    <form
      method="post"
      class="ml-6 mr-6 mt-10 w-96 rounded-lg bg-base-100 p-6 shadow-xl"
      action="?/signup"
      use:enhance={() => {
        isLoading = true
        form = null
        return async ({ update }) => {
          isLoading = false
          update()
        }
      }}
    >
      <h1 class="mb-4 text-center text-2xl font-bold">3PL Customer Sign Up</h1>
      <label class="mb-2 block">
        <span class="mb-1 block text-sm font-medium">Company Name</span>
        <input
          class="input input-bordered w-full bg-base-200"
          name="name"
          type="text"
          placeholder="Enter your company name"
          defaultValue={name}
          required
        />
      </label>
      <label class="mb-2 block">
        <span class="mb-1 block text-sm font-medium">Email</span>
        <input
          class="input input-bordered w-full bg-base-200"
          name="email"
          type="email"
          defaultValue={email}
          placeholder="Enter your email address"
          required
        />
      </label>
      <label class="mb-4 block">
        <span class="mb-1 block text-sm font-medium">Password</span>
        <input
          class="input input-bordered w-full bg-base-200"
          name="password"
          type="password"
          placeholder="Create a password"
          required
        />
      </label>

      {#if form?.message}
        <p class="mb-4 text-error">{form.message}</p>
      {/if}

      <button type="submit" class="btn btn-primary w-full" disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Submit'}
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
    <!-- Welcome Header -->
    <h1 class="animate-fade-in mt-14 text-center text-4xl font-bold">Welcome!</h1>
    <p class="mt-4 max-w-md text-center text-lg">
      Your 3PL customer account has been created successfully. Please login to your new portal
      <a class="link-primary font-semibold underline" href="/login">here</a>.
    </p>
  </div>
{/if}
