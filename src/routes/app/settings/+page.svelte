<script>
  let { data } = $props()
  import { enhance } from '$app/forms'
  import { invalidate } from '$app/navigation'

  // UI state
  let showDelete = $state(false)
  let showSuccess = $state(false)
  let serverMessage = $state('')
  let saving = $state(false)
  let savingPassword = $state(false)

  // User fields (initialized from server data)
  let name = $state(data.user?.name ?? '')
  let email = $state(data.user?.email ?? '')
  let phoneNumber = $state(data.user?.phone_number ?? '')
  let creditCardsUrl = $state(data.user?.credit_cards_url ?? '')
  let assetsUrl = $state(data.user?.assets_url ?? '')
  let debtsUrl = $state(data.user?.debts_url ?? '')
  let taxReturnsUrl = $state(data.user?.tax_returns_url ?? '')
  let transactionsUrl = $state(data.user?.transactions_url ?? '')
  let categoriesUrl = $state(data.user?.categories_url ?? '')

  // Dirty flags so unsaved edits aren't clobbered by re-renders/invalidation
  let isProfileDirty = $state(false)
  let isLinksDirty = $state(false)

  // When server data refreshes (invalidateAll), sync form fields
  $effect(() => {
    if (!isProfileDirty) {
      name = data.user?.name ?? ''
      email = data.user?.email ?? ''
      phoneNumber = data.user?.phone_number ?? ''
    }
    if (!isLinksDirty) {
      creditCardsUrl = data.user?.credit_cards_url ?? ''
      assetsUrl = data.user?.assets_url ?? ''
      debtsUrl = data.user?.debts_url ?? ''
      taxReturnsUrl = data.user?.tax_returns_url ?? ''
      transactionsUrl = data.user?.transactions_url ?? ''
      categoriesUrl = data.user?.categories_url ?? ''
    }
  })

  /**
   * Returns a handler compatible with use:enhance that, when invoked,
   * returns a result callback handling { update, result }.
   * @returns {(input: any) => (args: { update: () => Promise<void>, result: { type?: string, data?: any } }) => Promise<void>}
   */
  /**
   * @param {'profile' | 'links'} section
   */
  function handleUpdateEnhance(section) {
    return () =>
      /** @param {{ update: () => Promise<void>, result: { type?: string, data?: any } }} args */
      async (args) => {
        const { update, result } = args
        saving = true
        await update()
        saving = false
        const ok = result?.type !== 'failure'
        showSuccess = ok
        serverMessage = result?.data?.message || (ok ? 'Saved!' : 'Save failed')
        if (ok) {
          if (section === 'profile') isProfileDirty = false
          if (section === 'links') isLinksDirty = false
          await invalidate('app:settings:user')
          setTimeout(() => (showSuccess = false), 1200)
        }
      }
  }

  /**
   * @returns {(input: any) => (args: { update: () => Promise<void>, result: { type?: string, data?: any } }) => Promise<void>}
   */
  function handlePasswordEnhance() {
    return () =>
      /** @param {{ update: () => Promise<void>, result: { type?: string, data?: any } }} args */
      async (args) => {
        const { update, result } = args
        savingPassword = true
        await update()
        savingPassword = false
        const ok = result?.type !== 'failure'
        showSuccess = ok
        serverMessage =
          result?.data?.message || (ok ? 'Password updated' : 'Password update failed')
        if (ok) setTimeout(() => (showSuccess = false), 1200)
      }
  }
</script>

<svelte:head>
  <title>Settings</title>
</svelte:head>

{#if showSuccess}
  <div class="toast toast-top z-20">
    <div class="alert alert-success">
      <span>{serverMessage || 'Saved!'}</span>
    </div>
  </div>
{/if}

<div class="mx-auto max-w-3xl px-4 py-6">
  <div class="mb-6 flex flex-col gap-1">
    <h1 class="text-3xl font-bold">Account Settings</h1>
    <p class="text-sm text-base-content/70">Manage your account and preferences</p>
  </div>

  <form method="POST" action="?/updateUserDetails" use:enhance={handleUpdateEnhance('profile')}>
    <section class="mb-4 rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <h2 class="mb-4 text-xl font-semibold">Profile</h2>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label class="form-control w-full">
          <div class="label"><span class="label-text">Name</span></div>
          <input
            name="userName"
            class="input input-bordered w-full bg-base-200"
            placeholder="Your name"
            bind:value={name}
            oninput={() => (isProfileDirty = true)}
          />
        </label>
        <label class="form-control w-full">
          <div class="label"><span class="label-text">Email</span></div>
          <input
            name="userEmail"
            type="email"
            class="input input-bordered w-full bg-base-200"
            placeholder="name@email.com"
            bind:value={email}
            oninput={() => (isProfileDirty = true)}
          />
        </label>
        <label class="form-control w-full md:col-span-2">
          <div class="label"><span class="label-text">Phone</span></div>
          <input
            name="userPhone"
            class="input input-bordered w-full bg-base-200"
            placeholder="+11234567890"
            bind:value={phoneNumber}
            oninput={() => (isProfileDirty = true)}
          />
        </label>
      </div>
      <div class="mt-5 flex justify-end">
        <button type="submit" class="btn btn-primary w-full sm:w-auto"
          >{saving ? 'Saving…' : 'Save Changes'}</button
        >
      </div>
    </section>
  </form>

  <form method="POST" action="?/updateUserDetails" use:enhance={handleUpdateEnhance('links')}>
    <section class="mb-8 rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <h2 class="mb-4 text-xl font-semibold">Financial Links</h2>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label class="form-control w-full">
          <div class="label"><span class="label-text">Credit Cards URL</span></div>
          <input
            name="creditCardsUrl"
            class="input input-bordered w-full bg-base-200"
            placeholder="https://..."
            bind:value={creditCardsUrl}
            oninput={() => (isLinksDirty = true)}
          />
        </label>
        <label class="form-control w-full">
          <div class="label"><span class="label-text">Assets URL</span></div>
          <input
            name="assetsUrl"
            class="input input-bordered w-full bg-base-200"
            placeholder="https://..."
            bind:value={assetsUrl}
            oninput={() => (isLinksDirty = true)}
          />
        </label>
        <label class="form-control w-full">
          <div class="label"><span class="label-text">Debts URL</span></div>
          <input
            name="debtsUrl"
            class="input input-bordered w-full bg-base-200"
            placeholder="https://..."
            bind:value={debtsUrl}
            oninput={() => (isLinksDirty = true)}
          />
        </label>
        <label class="form-control w-full">
          <div class="label"><span class="label-text">Tax Returns URL</span></div>
          <input
            name="taxReturnsUrl"
            class="input input-bordered w-full bg-base-200"
            placeholder="https://..."
            bind:value={taxReturnsUrl}
            oninput={() => (isLinksDirty = true)}
          />
        </label>
        <label class="form-control w-full">
          <div class="label"><span class="label-text">Transactions URL</span></div>
          <input
            name="transactionsUrl"
            class="input input-bordered w-full bg-base-200"
            placeholder="https://..."
            bind:value={transactionsUrl}
            oninput={() => (isLinksDirty = true)}
          />
        </label>
        <label class="form-control w-full">
          <div class="label"><span class="label-text">Categories URL</span></div>
          <input
            name="categoriesUrl"
            class="input input-bordered w-full bg-base-200"
            placeholder="https://..."
            bind:value={categoriesUrl}
            oninput={() => (isLinksDirty = true)}
          />
        </label>
      </div>
      <div class="mt-5 flex justify-end">
        <button type="submit" class="btn btn-primary w-full sm:w-auto"
          >{saving ? 'Saving…' : 'Save Changes'}</button
        >
      </div>
    </section>
  </form>

  <section class="mt-10 rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
    <h2 class="mb-4 text-xl font-semibold">Security</h2>
    <form
      method="POST"
      action="?/updateUserPassword"
      use:enhance={handlePasswordEnhance()}
      class="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <label class="form-control w-full">
        <div class="label"><span class="label-text">New Password</span></div>
        <input
          name="userPassword"
          type="password"
          class="input input-bordered w-full bg-base-200"
          placeholder="••••••••"
        />
      </label>
      <label class="form-control w-full">
        <div class="label"><span class="label-text">Confirm Password</span></div>
        <input
          name="userConfirmPassword"
          type="password"
          class="input input-bordered w-full bg-base-200"
          placeholder="••••••••"
        />
      </label>
      <div class="flex justify-end md:col-span-2">
        <button type="submit" class="btn btn-outline"
          >{savingPassword ? 'Updating…' : 'Update Password'}</button
        >
      </div>
    </form>
  </section>

  <section class="mt-10 rounded-xl border border-error/40 bg-base-100 p-5 shadow-sm">
    <h2 class="mb-4 text-xl font-semibold text-error">Danger Zone</h2>
    <div class="flex items-center justify-between">
      <div>
        <p class="font-medium">Delete Account</p>
        <p class="text-sm opacity-70">This will permanently delete your account and data.</p>
      </div>
      <button class="btn btn-error" onclick={() => (showDelete = true)}>Delete Account</button>
    </div>
  </section>
</div>

<!-- Delete account modal -->
<div class={`modal ${showDelete ? 'modal-open' : ''}`}>
  <div class="modal-box">
    <h3 class="text-lg font-semibold">Delete account?</h3>
    <p class="mt-2 text-sm opacity-80">This action is permanent and cannot be undone.</p>
    <div class="modal-action">
      <button class="btn" onclick={() => (showDelete = false)}>Cancel</button>
      <form method="POST" action="?/deleteAccount">
        <button class="btn btn-error">Yes, delete</button>
      </form>
    </div>
  </div>
</div>
