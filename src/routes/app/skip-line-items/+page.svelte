<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'

  // Import props
  let { data } = $props()

  // Import utils
  import {
    formatTimeStampForChangelog,
    displayDistributionPartnersAnd3plCustomers,
  } from '$lib/utils.js'

  // Import stores
  import { lineItemsToSkip, loadLineItemsToSkip } from '$lib/stores/lineItemsToSkip.js'
  import { users, loadUsers } from '$lib/stores/users.js'

  // Coupon fields
  let brandName = $state('')
  let brandId = $derived($users.find((user) => user?.name === brandName)?.email)
  let brandNames = $derived(displayDistributionPartnersAnd3plCustomers($users))
  let name = $state('')

  let showEditLineItemModal = $state(false)
  let lineItemToEdit = $state({})

  async function editLineItem(event) {
    event.preventDefault()
    const response = await fetch('/app/api/line-items-to-skip/edit-line-item', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: lineItemToEdit?.id,
        brand_id: brandId,
        brand_name: brandName,
        name,
      }),
    })
    if (response.ok) {
      await loadLineItemsToSkip(data.supabase)
      resetLineItemFields()
    } else {
      const errorData = await response.json()
      console.error(errorData)
      alert(`Failed to edit product: ${errorData.message}`)
    }
    showEditLineItemModal = false
  }

  function resetLineItemFields() {
    lineItemToEdit = {}
    brandName = ''
    name = ''
  }

  function setLineItemFields(lineItem) {
    lineItemToEdit = lineItem
    brandName = lineItem?.brand_name
    name = lineItem?.name
  }

  async function deleteLineItem(id) {
    const response = await fetch('/app/api/line-items-to-skip/delete-line-item', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
      }),
    })
    if (response.ok) {
      await loadLineItemsToSkip(data.supabase)
    } else {
      const errorData = await response.json()
      console.error(errorData)
      alert(`Failed to delete line item: ${errorData.message}`)
    }
  }

  // Execute onMount
  onMount(() => {
    loadLineItemsToSkip(data.supabase)
    loadUsers(data.supabase)
  })
</script>

<div class="mt-4 flex justify-center px-2 sm:px-4 md:mt-10">
  <div class="w-full max-w-4xl rounded-lg bg-base-100 p-2 shadow-xl sm:p-4">
    <h1 class="mb-3 text-center text-2xl font-bold sm:mb-5 sm:text-3xl">Line Items to Skip</h1>
    <!-- Table for medium screens and up -->
    <div class="hidden overflow-x-auto md:block">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>Date Added</th>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each $lineItemsToSkip as lineItem}
            <tr>
              <td>{formatTimeStampForChangelog(lineItem?.created_at)}</td>
              <td>{lineItem?.name}</td>
              <td>
                <div class="flex space-x-2">
                  <button
                    onclick={() => {
                      setLineItemFields(lineItem)
                      showEditLineItemModal = true
                    }}
                    class="btn btn-info btn-sm">Edit</button
                  >
                  <button onclick={() => deleteLineItem(lineItem?.id)} class="btn btn-error btn-sm"
                    >Delete</button
                  >
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- EDIT SKIP LINE ITEMS MODAL BEGINS -->
<div class={`modal ${showEditLineItemModal ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      onclick={() => (showEditLineItemModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <form onsubmit={editLineItem}>
      <h3 class="text-center text-xl font-bold">Edit Line Item</h3>
      <div class="form-control mt-4">
        <label class="label" for="brandName">Brand Name</label>
        <select class="select select-bordered bg-base-200" bind:value={brandName}>
          {#each brandNames as name}
            <option value={name}>{name}</option>
          {/each}
        </select>
        <label class="label" for="brandIs">Brand Id</label>
        <input
          type="text"
          placeholder="Brand Id"
          value={brandId}
          class="input input-bordered mb-2 bg-base-200"
        />
        <label class="label" for="clientId">Name</label>
        <input
          type="text"
          placeholder="Coupon Name"
          bind:value={name}
          class="input input-bordered mb-2 bg-base-200"
        />

        <div class="mt-4 flex justify-center">
          <button class="btn btn-primary" type="submit">Submit</button>
        </div>
      </div>
    </form>
  </div>
</div>
<!-- EDIT SKIP LINE ITEMS MODAL ENDS -->
