<script>
  import { enhance } from '$app/forms'
  import { page } from '$app/state'

  let { form = $bindable() } = $props()

  let isLoading = $state(false)

  let email = $derived(form?.email ?? page.url.searchParams.get('email') ?? '')
  let loginMethod = $state('magic')
  let isMagic = $derived(loginMethod === 'magic')
  let message = $derived(form?.message ?? page.url.searchParams.get('message') ?? '')
  let isSuccess = $derived(!!form?.success)
</script>

<div class="flex flex-1 flex-col items-center justify-center">
  <form
    method="post"
    class="bg-base-100 ml-6 mr-6 mt-10 w-96 rounded-lg p-6 shadow-xl"
    use:enhance={() => {
      isLoading = true
      form = null
      return async ({ update }) => {
        isLoading = false
        update()
      }
    }}
  >
    <h1 class="mb-4 text-center text-2xl font-bold">Log in</h1>
    <div role="tablist" class="tabs-boxed tabs mb-4 w-full">
      <button
        type="button"
        role="tab"
        class={`tab grow ${!isMagic ? 'tab-active' : ''}`}
        onclick={() => (loginMethod = 'password')}
        aria-selected={!isMagic}
      >
        Password
      </button>
      <button
        type="button"
        role="tab"
        class={`tab grow ${isMagic ? 'tab-active' : ''}`}
        onclick={() => (loginMethod = 'magic')}
        aria-selected={isMagic}
      >
        Magic Link
      </button>
    </div>
    <input type="hidden" name="method" value={loginMethod} />
    <label class="mb-2 block">
      <input
        class="input input-bordered bg-base-200 w-full"
        name="email"
        type="email"
        value={email}
        placeholder="Email"
        disabled={isLoading}
      />
    </label>
    {#if !isMagic}
      <label class="mb-4 block">
        <input
          class="input input-bordered bg-base-200 w-full"
          name="password"
          type="password"
          placeholder="Password"
          disabled={isLoading}
        />
      </label>
    {/if}
    <!-- Forgot Password Link -->
    {#if !isMagic}
      <div class="mb-4 text-right">
        <a href="/reset-password" class="link link-primary text-sm"> Forgot Password? </a>
      </div>
    {/if}
    {#if message}
      <p class={`mb-4 text-center ${isSuccess ? 'text-success' : 'text-error'}`}>{message}</p>
    {/if}
    <button type="submit" class="btn btn-primary w-full" disabled={isLoading}>
      {#if isLoading}
        Loading...
      {:else if isMagic}
        Send Magic Link
      {:else}
        Log in
      {/if}
    </button>
    <!-- Sign-Up Prompt -->
    <!-- <p class="text-md mt-4 text-center">
      Don't have an account?
      <a href="/signup" class="link link-primary">Sign up here</a>.
    </p> -->
  </form>
</div>
