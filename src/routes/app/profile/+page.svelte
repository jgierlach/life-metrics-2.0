<script>
  let user = {
    name: 'John Doe',
    email: 'johndoe@example.com',
    phone: '123-456-7890',
    profilePicture: 'https://via.placeholder.com/150',
    overview: 'A passionate developer who loves building web applications.',
  }

  let isEditing = false

  function toggleEditMode() {
    isEditing = !isEditing
  }

  function saveChanges() {
    // Logic to save user data
    isEditing = false
  }
</script>

<div
  class="mx-auto mt-10 max-w-3xl rounded-2xl bg-gradient-to-r from-base-100 to-base-200 p-8 shadow-xl"
>
  <!-- Header Section -->
  <div class="flex flex-col items-center text-center">
    <!-- Profile Image -->
    <img
      src={user.profilePicture}
      alt="Profile Picture"
      class="border-primary mb-4 h-28 w-28 rounded-full border-4 shadow-lg"
    />

    <!-- Name (editable) -->
    <div class="w-full">
      {#if isEditing}
        <input
          type="text"
          bind:value={user.name}
          class="input input-bordered w-1/2 bg-base-200 text-center text-lg font-semibold"
        />
      {:else}
        <h1 class="text-primary mb-2 text-4xl font-extrabold">{user.name}</h1>
      {/if}
    </div>

    <!-- Edit Profile Button -->
    <div>
      {#if isEditing}
        <button
          class="btn btn-outline btn-sm mt-2 transition-all hover:btn-error"
          on:click={toggleEditMode}
        >
          Cancel
        </button>
      {:else}
        <button
          class="btn btn-primary btn-sm mt-2 transition-all hover:btn-accent"
          on:click={toggleEditMode}
        >
          Edit Profile
        </button>
      {/if}
    </div>
  </div>

  <!-- Details Section -->
  <div class="mt-8 space-y-6">
    <!-- Email and Phone (grid layout) -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <!-- Email -->
      <div>
        <label class="text-sm font-semibold text-gray-600">Email</label>
        {#if isEditing}
          <input
            type="email"
            bind:value={user.email}
            class="input input-bordered mt-1 w-full bg-base-200"
          />
        {:else}
          <p class="text-primary mt-1">{user.email}</p>
        {/if}
      </div>

      <!-- Phone -->
      <div>
        <label class="text-sm font-semibold text-gray-600">Phone Number</label>
        {#if isEditing}
          <input
            type="text"
            bind:value={user.phone}
            class="input input-bordered mt-1 w-full bg-base-200"
          />
        {:else}
          <p class="text-primary mt-1">{user.phone}</p>
        {/if}
      </div>
    </div>

    <!-- Profile Overview -->
    <div>
      <label class="text-sm font-semibold text-gray-600">Profile Overview</label>
      {#if isEditing}
        <textarea
          bind:value={user.overview}
          class="textarea textarea-bordered mt-1 w-full bg-base-200"
        ></textarea>
      {:else}
        <p class="text-primary mt-2">{user.overview}</p>
      {/if}
    </div>
  </div>

  <!-- Save Button -->
  {#if isEditing}
    <div class="flex justify-end">
      <button
        class="btn btn-primary mt-6 px-6 py-2 text-lg font-medium transition-all hover:btn-accent"
        on:click={saveChanges}
      >
        Save Changes
      </button>
    </div>
  {/if}
</div>
