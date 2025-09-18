<script>
  let { data } = $props()
  const { user, session } = data
  import UpdateField from './components/UpdateField.svelte'
  import UpdateUserPasswordModal from './components/UpdateUserPasswordModal.svelte'
  import ConfirmDeleteModal from './components/ConfirmDeleteModal.svelte'
  import SuccessOverlay from '$lib/components/SuccessOverlay.svelte'
  import { enhance } from '$app/forms'

  let showPasswordModal = $state(false)
  let showDeleteModal = $state(false)
  let showSuccess = $state(false)
  let serverMessage = $state('')

  // User fields
  let name = $state(user?.name)
  let email = $state(user?.email)
  let phoneNumber = $state(user?.phone_number)
  let password = $state(user?.password)
  let creditCardsUrl = $state(user?.credit_cards_url)
  let assetsUrl = $state(user?.assets_url)
  let debtsUrl = $state(user?.debts_url)
  let taxReturnsUrl = $state(user?.tax_returns_url)
  let transactionsUrl = $state(user?.transactions_url)
  let categoriesUrl = $state(user?.categories_url)

  /**
   * @param {{ update: () => Promise<void>, result: { type?: string, data?: any } }} args
   */
  const afterSubmit = async (args) => {
    const { update, result } = args
    showSuccess = result?.type !== 'failure'
    serverMessage = result?.data?.message || ''
    await update()
    if (showSuccess) {
      setTimeout(() => (showSuccess = false), 1400)
    }
  }
</script>

<svelte:head>
  <title>Settings</title>
</svelte:head>

<SuccessOverlay visible={showSuccess} message="Saved!" subtext="Your settings were updated." />

<div class="mx-auto max-w-3xl px-4 py-6">
  <h1 class="mb-6 text-3xl font-bold">Account Settings</h1>

  <section class="mb-10 rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
    <h2 class="mb-4 text-xl font-semibold">Profile</h2>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <UpdateField
        id="userName"
        label="Name"
        placeholder="Your name"
        defaultValue={name}
        formAction="updateUserDetails"
        onUpdated={() => (showSuccess = true)}
      />
      <UpdateField
        id="userEmail"
        type="email"
        label="Email"
        placeholder="name@email.com"
        defaultValue={email}
        formAction="updateUserDetails"
        onUpdated={() => (showSuccess = true)}
      />
      <UpdateField
        id="userPhone"
        label="Phone"
        placeholder="+11234567890"
        defaultValue={phoneNumber}
        formAction="updateUserDetails"
        onUpdated={() => (showSuccess = true)}
      />
    </div>
  </section>

  <section class="mb-10 rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
    <h2 class="mb-4 text-xl font-semibold">Security</h2>
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="font-medium">Password</p>
        <p class="text-sm opacity-70">Set a strong, unique password.</p>
      </div>
      <button class="btn btn-outline" onclick={() => (showPasswordModal = true)}
        >Update Password</button
      >
    </div>
  </section>

  <section class="mb-10 rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
    <h2 class="mb-4 text-xl font-semibold">Financial Docs</h2>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <UpdateField
        id="creditCardsUrl"
        label="Credit Cards URL"
        placeholder="https://..."
        defaultValue={creditCardsUrl}
        formAction="updateUserDetails"
        onUpdated={() => (showSuccess = true)}
      />
      <UpdateField
        id="assetsUrl"
        label="Assets URL"
        placeholder="https://..."
        defaultValue={assetsUrl}
        formAction="updateUserDetails"
        onUpdated={() => (showSuccess = true)}
      />
      <UpdateField
        id="debtsUrl"
        label="Debts URL"
        placeholder="https://..."
        defaultValue={debtsUrl}
        formAction="updateUserDetails"
        onUpdated={() => (showSuccess = true)}
      />
      <UpdateField
        id="taxReturnsUrl"
        label="Tax Returns URL"
        placeholder="https://..."
        defaultValue={taxReturnsUrl}
        formAction="updateUserDetails"
        onUpdated={() => (showSuccess = true)}
      />
      <UpdateField
        id="transactionsUrl"
        label="Transactions URL"
        placeholder="https://..."
        defaultValue={transactionsUrl}
        formAction="updateUserDetails"
        onUpdated={() => (showSuccess = true)}
      />
      <UpdateField
        id="categoriesUrl"
        label="Categories URL"
        placeholder="https://..."
        defaultValue={categoriesUrl}
        formAction="updateUserDetails"
        onUpdated={() => (showSuccess = true)}
      />
    </div>
  </section>

  <section class="rounded-xl border border-error/40 bg-base-100 p-5 shadow-sm">
    <h2 class="mb-4 text-xl font-semibold text-error">Danger Zone</h2>
    <div class="flex items-center justify-between">
      <div>
        <p class="font-medium">Delete Account</p>
        <p class="text-sm opacity-70">This will permanently delete your account and data.</p>
      </div>
      <button class="btn btn-error" onclick={() => (showDeleteModal = true)}>Delete Account</button>
    </div>
    <form
      method="POST"
      action="?/deleteAccount"
      use:enhance={() => afterSubmit}
      class="hidden"
    ></form>
  </section>
</div>

<UpdateUserPasswordModal
  bind:isOpen={showPasswordModal}
  onClose={() => (showPasswordModal = false)}
/>

<ConfirmDeleteModal
  bind:isOpen={showDeleteModal}
  onClose={() => (showDeleteModal = false)}
  onConfirm={() => {
    const el = document.querySelector('form[action*="deleteAccount"]')
    if (el && el instanceof HTMLFormElement) {
      if (typeof el.requestSubmit === 'function') {
        el.requestSubmit()
      } else {
        el.submit()
      }
    }
  }}
/>
