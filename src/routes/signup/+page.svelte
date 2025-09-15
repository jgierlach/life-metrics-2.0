<script>
  import { enhance } from '$app/forms'

  let { form = $bindable() } = $props()

  let isLoading = $state(false)
  let passwordVisible = $state(false)
  let phoneError = $state('')

  // Signup fields
  let name = $derived(form?.data?.name ?? '')
  let email = $derived(form?.data?.email ?? '')
  // 'phoneNumber' may not exist on all form.data shapes; cast to any for safety
  let phoneNumber = $derived(/** @type {any} */ (form?.data)?.phoneNumber ?? '')
  let showConfirmation = $derived(form?.showConfirmation ?? false)

  // Controlled values for inputs; keep in sync with server-returned form data
  let nameValue = $state('')
  let emailValue = $state('')
  let phoneValue = $state('')

  $effect(() => {
    nameValue = name
    emailValue = email
    phoneValue = phoneNumber
  })

  /** @param {string} value */
  function validatePhone(value) {
    const digits = (value || '').replace(/\D/g, '')
    if (!value || digits.length === 0) {
      return 'Please enter your phone number'
    }
    if (digits.length < 10) {
      return 'Phone number seems too short'
    }
    if (digits.length > 15) {
      return 'Phone number seems too long'
    }
    return ''
  }
</script>

<svelte:head>
  <title>Life Metrics | User Sign Up</title>
</svelte:head>

{#if !showConfirmation}
  <div class="flex flex-1 flex-col items-center justify-center">
    <form
      method="post"
      class="mx-4 mt-10 w-full max-w-md rounded-xl bg-base-100 p-6 shadow-xl"
      action="?/signup"
      aria-describedby={form?.message ? 'form-error' : undefined}
      aria-live="polite"
      onsubmit={(/** @type {SubmitEvent} */ e) => {
        const error = validatePhone(phoneValue)
        const formEl = /** @type {HTMLFormElement} */ (e.currentTarget)
        const input = formEl
          ? /** @type {HTMLInputElement|null} */ (formEl.querySelector('input[name="phoneNumber"]'))
          : null
        if (error) {
          phoneError = error
          if (input) {
            input.setCustomValidity(error)
            input.reportValidity()
          }
          e.preventDefault()
          return
        }
        if (input) input.setCustomValidity('')
      }}
      use:enhance={() => {
        isLoading = true
        form = null
        return async ({ update }) => {
          isLoading = false
          update()
        }
      }}
    >
      <h1 class="mb-2 text-center text-3xl font-extrabold">Create your account</h1>
      <p class="mb-6 text-center text-sm opacity-80">
        Start tracking what matters. No credit card required.
      </p>

      <label class="mb-3 block">
        <span class="mb-1 block text-sm font-medium">Name</span>
        <input
          class="input input-bordered w-full bg-base-200"
          name="name"
          type="text"
          placeholder="e.g., Hometown Industries"
          autocomplete="organization"
          bind:value={nameValue}
          required
        />
      </label>

      <label class="mb-3 block">
        <span class="mb-1 block text-sm font-medium">Email</span>
        <input
          class="input input-bordered w-full bg-base-200"
          name="email"
          type="email"
          placeholder="you@company.com"
          autocomplete="email"
          bind:value={emailValue}
          required
        />
      </label>

      <label class="mb-3 block">
        <span class="mb-1 block text-sm font-medium">Password</span>
        <div class="relative">
          <input
            class="input input-bordered w-full bg-base-200 pr-12"
            name="password"
            type={passwordVisible ? 'text' : 'password'}
            placeholder="Create a strong password"
            autocomplete="new-password"
            minlength="8"
            required
          />
          <button
            type="button"
            class="btn btn-ghost btn-xs absolute right-2 top-1/2 -translate-y-1/2"
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            onclick={() => (passwordVisible = !passwordVisible)}
          >
            {passwordVisible ? 'Hide' : 'Show'}
          </button>
        </div>
        <span class="mt-1 block text-xs opacity-70"
          >Use 8+ characters with a mix of letters and numbers.</span
        >
      </label>

      <label class="mb-2 block">
        <span class="mb-1 block text-sm font-medium">Phone number</span>
        <input
          class="input input-bordered w-full bg-base-200"
          name="phoneNumber"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          placeholder="e.g., +1 (555) 123-4567"
          aria-invalid={phoneError ? true : undefined}
          aria-describedby={phoneError ? 'phone-error' : undefined}
          bind:value={phoneValue}
          oninput={(e) => {
            const target = /** @type {HTMLInputElement} */ (e.currentTarget)
            if (!target) return
            phoneError = ''
            target.setCustomValidity('')
          }}
          onblur={(e) => {
            const target = /** @type {HTMLInputElement} */ (e.currentTarget)
            if (!target) return
            const msg = validatePhone(target.value)
            phoneError = msg
            target.setCustomValidity(msg)
          }}
          required
        />
        {#if phoneError}
          <span id="phone-error" class="mt-1 block text-xs text-error">{phoneError}</span>
        {/if}
      </label>

      {#if form?.message}
        <p id="form-error" class="mb-4 text-error">{form.message}</p>
      {/if}

      <button type="submit" class="btn btn-primary w-full" disabled={isLoading}>
        {isLoading ? 'Creating account…' : 'Create account'}
      </button>

      <!-- <p class="mt-3 text-center text-xs opacity-70">
        By continuing, you agree to our <a class="link link-primary" href="/terms">Terms</a>
        and <a class="link link-primary" href="/privacy">Privacy Policy</a>.
      </p> -->

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
      Your Life Metrics account has been created successfully. Please login to your new portal
      <a class="link-primary font-semibold underline" href="/login">here</a>.
    </p>
  </div>
{/if}
