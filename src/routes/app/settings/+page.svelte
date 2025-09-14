<script>
  import UpdateField from './components/UpdateField.svelte'
  import ConfirmDeleteModal from './components/ConfirmDeleteModal.svelte'
  import UpdateUserPasswordModal from './components/UpdateUserPasswordModal.svelte'

  let showUpdatePasswordModal = $state(false)
  let showDeleteUserModal = $state(false)

  let { form = $bindable(), data } = $props()

  let { session } = $derived(data)
  let userName = $derived(session?.user?.user_metadata?.name ?? '')
  let userEmail = $derived(session?.user?.email ?? '')
  let userPhone = $derived(session?.user?.phone ?? '')
  let message = $derived(form?.message ?? '')
  let serverData = $derived(form?.data ?? {})
  /**
   * @type {Record<string, string>}
   */
  let errors = $derived(
    Object.keys(serverData).reduce((acc, key) => {
      // @ts-ignore
      if (serverData[key]) {
        // @ts-ignore
        acc[key] = message
      }
      return acc
    }, {}),
  )

  const handleResetForm = () => {
    form = null
  }
</script>

<svelte:head>
  <title>Settings</title>
</svelte:head>

<!-- Page Layout -->
<div class="container mx-auto max-w-3xl p-4 sm:p-6 lg:p-12">
  <!-- Card Wrapper -->
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-2xl font-semibold">Settings</h2>

      <!-- Name Section -->
      <UpdateField
        id="userName"
        placeholder="Enter your name"
        formAction="updateUserDetails"
        label="Name"
        defaultValue={userName}
        error={errors.userName}
        onSubmit={handleResetForm}
      />

      <!-- Email Section -->
      <UpdateField
        id="userEmail"
        type="email"
        placeholder="Enter your email"
        formAction="updateUserDetails"
        label="Email Address"
        defaultValue={userEmail}
        error={errors.userEmail}
        onSubmit={handleResetForm}
      />

      <!-- Phone Number Section -->
      <UpdateField
        id="userPhone"
        type="tel"
        placeholder="Enter your phone number"
        formAction="updateUserDetails"
        label="Phone Number"
        defaultValue={userPhone}
        error={errors.userPhone}
        onSubmit={handleResetForm}
      />

      <!-- Password Section -->
      <UpdateField
        id="userPassword"
        type="password"
        placeholder="Enter a new password"
        required={false}
        label="Password"
        onClick={() => (showUpdatePasswordModal = !showUpdatePasswordModal)}
      />

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Delete Account Section -->
      <div class="mt-6 text-center">
        <h3 class="text-lg font-semibold text-red-600">Danger Zone</h3>
        <p class="mt-2 text-sm text-gray-600">
          Deleting your account is a permanent action and cannot be undone.
        </p>
        <button
          class="btn btn-error mt-4 w-full md:w-auto"
          onclick={() => (showDeleteUserModal = !showDeleteUserModal)}
        >
          Delete Account
        </button>
      </div>
    </div>
  </div>
</div>

<!-- DELETE USER MODAL BEGINS -->
<ConfirmDeleteModal bind:isOpen={showDeleteUserModal} onClose={handleResetForm} />
<!-- DELETE USER MODAL ENDS -->

<!-- UPDATE PASSWORD MODAL BEGINS -->
<UpdateUserPasswordModal
  bind:isOpen={showUpdatePasswordModal}
  error={errors.userPassword}
  onClose={handleResetForm}
/>
<!-- UPDATE PASSWORD MODAL ENDS -->
