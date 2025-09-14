<script>
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import {
    orders,
    loadOrders,
    currentPage,
    pageSize,
    totalOrdersCount,
    searchQuery,
    orderTypeFilter,
  } from '$lib/stores/orders.js'
  import { users, loadUsers } from '$lib/stores/users.js'
  import { invoices, loadInvoices } from '$lib/stores/invoices'

  // Import utility functions
  import {
    formatDollarValue,
    formatTimeStampForChangelog,
    findBrandNameByBrandId,
    findIfHasOverdueUnpaidInvoice,
  } from '$lib/utils'

  let { data } = $props()

  // Get brandId from session
  let brandId = $derived(data?.session?.user?.email)
  let brandName = $derived(findBrandNameByBrandId($users, brandId))

  let hasOverDueUnpaidInvoice = $derived(findIfHasOverdueUnpaidInvoice($invoices))

  // Order fields
  let orderNumber = $state('')
  let orderSource = $state('')
  let orderDate = $state('')
  let customerEmail = $state('')
  let customerName = $state('')
  let recipientCompany = $state('')
  let fulfillmentChannel = $state('')
  let street1 = $state('')
  let city = $state('')
  let orderState = $state('')
  let postalCode = $state('')
  let country = $state('')
  let carrier = $state('')
  let trackingNumber = $state('')
  let status = $state('')
  let costOfShipment = $state(0)
  let referralFee = $state(0)
  let totalPaid = $state(0)
  let totalUnitQuantity = $state(0)
  let totalCostOfGoods = $state(0)
  let notes = $state('')
  let is3plOrder = $state(false)

  function resetOrderFields() {
    orderNumber = ''
    orderSource = ''
    orderDate = ''
    customerEmail = ''
    customerName = ''
    recipientCompany = ''
    fulfillmentChannel = ''
    street1 = ''
    city = ''
    orderState = ''
    postalCode = ''
    country = ''
    carrier = ''
    trackingNumber = ''
    status = ''
    costOfShipment = 0
    referralFee = 0
    totalPaid = 0
    totalUnitQuantity = 0
    totalCostOfGoods = 0
    notes = ''
    is3plOrder = false
  }

  /**
   * @param {any} order
   */
  function setOrderFields(order) {
    orderNumber = order?.order_number
    orderSource = order?.order_source
    orderDate = order?.order_date
    customerEmail = order?.customer_email
    customerName = order?.customer_name
    recipientCompany = order?.recipient_company
    fulfillmentChannel = order?.fulfillment_channel
    street1 = order?.street1
    city = order?.city
    orderState = order?.state
    postalCode = order?.postal_code
    country = order?.country
    carrier = order?.carrier
    trackingNumber = order?.tracking_number
    status = order?.status
    costOfShipment = order?.cost_of_shipment
    referralFee = order?.referral_fee
    totalPaid = order?.total_paid
    totalUnitQuantity = order?.total_unit_quantity
    totalCostOfGoods = order?.total_cost_of_good
    notes = order?.notes
    is3plOrder = order?.is_3pl_order
  }

  let orderToDelete = $state(/** @type {any} */ (null))
  let showDeleteOrderModal = $state(false)

  /**
   * id to reference order to delete
   * @param {number} id
   */
  async function deleteOrder(id) {
    const response = await fetch(`/app/api/orders/delete-order`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
      }),
    })
    if (response.ok) {
      await loadOrders(data.supabase, brandId)
    } else {
      const errorData = await response.json()
      console.error(errorData)
      alert(`Failed to delete product: ${errorData.message}`)
    }
    showDeleteOrderModal = false
  }

  let orderToEdit = $state(/** @type {any} */ (null))
  let showEditOrderModal = $state(false)

  async function editOrder() {
    const response = await fetch('/app/api/orders/edit-order', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: orderToEdit?.id,
        brand_id: brandId,
        order_number: orderNumber,
        order_source: orderSource,
        order_date: orderDate,
        customer_email: customerEmail,
        customer_name: customerName,
        recipient_company: recipientCompany,
        fulfillment_channel: fulfillmentChannel,
        street1: street1,
        city: city,
        state: orderState,
        postal_code: postalCode,
        country: country,
        carrier: carrier,
        tracking_number: trackingNumber,
        status: status,
        cost_of_shipment: costOfShipment,
        referral_fee: referralFee,
        total_paid: totalPaid,
        total_unit_quantity: totalUnitQuantity,
        total_cost_of_goods: totalCostOfGoods,
        notes: notes,
        is_3pl_order: is3plOrder,
      }),
    })
    if (response.ok) {
      await loadOrders(data.supabase, brandId)
      resetOrderFields()
    } else {
      const errorData = await response.json()
      console.error(errorData)
      alert(`Failed to edit order: ${errorData.message}`)
    }
    showEditOrderModal = false
  }

  // Pagination controls
  const pageSizeOptions = [50, 100, 250, 500, 1000]

  /**
   * @param {number} page
   */
  async function goToPage(page) {
    $currentPage = page
    await loadOrders(data.supabase, brandId)
  }

  /**
   * @param {number} size
   */
  async function changePageSize(size) {
    $pageSize = size
    $currentPage = 1 // Reset to first page on page size change
    await loadOrders(data.supabase, brandId)
  }

  /**
   * @param {Event} event
   */
  function handlePageSizeChange(event) {
    if (event.target && 'value' in event.target) {
      const value = Number(event.target.value)
      changePageSize(value)
    }
  }

  function getTotalPages() {
    return Math.ceil($totalOrdersCount / $pageSize)
  }

  // Helper function to generate page numbers for pagination
  function generatePageNumbers() {
    const totalPages = getTotalPages()
    const maxVisiblePages = 5
    const result = []

    if (totalPages <= maxVisiblePages) {
      // If we have fewer pages than the max we want to show, display all of them
      for (let i = 1; i <= totalPages; i++) {
        result.push(i)
      }
    } else {
      // More complex logic for when we have lots of pages
      const currentPageValue = $currentPage

      // Always show first page
      result.push(1)

      // Calculate start and end of the visible page window
      let startPage = Math.max(2, currentPageValue - 1)
      let endPage = Math.min(totalPages - 1, startPage + 2)

      // Adjust if we're near the end
      if (endPage - startPage < 2) {
        startPage = Math.max(2, endPage - 2)
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        result.push('...')
      }

      // Add the middle pages
      for (let i = startPage; i <= endPage; i++) {
        result.push(i)
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        result.push('...')
      }

      // Always show last page
      if (totalPages > 1) {
        result.push(totalPages)
      }
    }

    return result
  }

  /**
   * @param {string|number} pageNum
   */
  function handlePageClick(pageNum) {
    if (typeof pageNum === 'number') {
      goToPage(pageNum)
    }
  }

  // Format the date for better display
  /**
   * @param {string} dateString
   */
  function formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  /**
   * Handle search input and trigger search when Enter is pressed
   * @param {KeyboardEvent} event
   */
  async function handleSearchKeyDown(event) {
    if (event.key === 'Enter') {
      $currentPage = 1 // Reset to first page when searching
      await loadOrders(data.supabase, brandId)
    }
  }

  /**
   * Handle the search button click
   */
  async function handleSearch() {
    $currentPage = 1 // Reset to first page when searching
    await loadOrders(data.supabase, brandId)
  }

  /**
   * Handle order type filter change
   * @param {string} filterType
   */
  async function handleOrderTypeFilter(filterType) {
    $orderTypeFilter = filterType
    $currentPage = 1 // Reset to first page when filtering
    await loadOrders(data.supabase, brandId)
  }

  /**
   * Navigate to create order page
   */
  function navigateToCreateOrder() {
    if (hasOverDueUnpaidInvoice) {
      alert('You have overdue invoices. Please pay them to create an order.')
      return
    }
    goto('/app/orders/create')
  }

  // Execute onMount
  onMount(async () => {
    if (brandId) {
      await loadInvoices(data.supabase, brandId)
      await loadOrders(data.supabase, brandId)
      await loadUsers(data.supabase)
    }
  })
</script>

<div class="mt-10 flex justify-center">
  <div class="ml-10 mr-10 w-full max-w-full overflow-hidden rounded-lg bg-base-100 p-4 shadow-xl">
    <h1 class="mb-4 text-center text-3xl font-bold">{brandName} - Orders</h1>

    <div class="mb-5 flex justify-center">
      <button onclick={navigateToCreateOrder} class="btn btn-outline btn-primary btn-sm"
        >Create Order <i class="fas fa-plus"></i></button
      >
    </div>
    <!-- Search bar and filter controls -->
    <div class="mb-4 flex flex-col items-center gap-4">
      <!-- Search bar -->
      <div class="flex w-full max-w-sm items-center">
        <input
          type="text"
          placeholder="Search by order number, customer name, tracking number, or notes..."
          class="input input-bordered w-full bg-base-200"
          bind:value={$searchQuery}
          onkeydown={handleSearchKeyDown}
        />
        <button
          class="btn btn-square btn-primary"
          onclick={handleSearch}
          aria-label="Search inventory"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>

      <!-- Page size selector in its own container -->
      <div class="flex items-center gap-2">
        <span>Page Size:</span>
        <select
          class="select select-bordered select-sm"
          value={$pageSize}
          onchange={handlePageSizeChange}
        >
          {#each pageSizeOptions as option}
            <option value={option}>{option}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- This div makes the table horizontally scrollable -->
    <div class="w-full overflow-x-auto">
      <table class="table table-zebra min-w-[1000px]">
        <thead>
          <tr>
            <th>Order Date</th>
            <th>Order Number</th>
            <th>Customer Name</th>
            <!-- <th>Fulfillment Channel</th> -->
            <th>Order Source</th>
            <th>Carrier</th>
            <th>Tracking Number</th>
            <th>Status</th>
            <th>Units</th>
            <th>Total Paid</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each $orders as order}
            <tr>
              <td>{formatTimeStampForChangelog(order?.created_at)}</td>
              <td
                ><a class="link-hover link-primary font-bold" href="/app/orders/{order?.id}"
                  >{order?.order_number}</a
                ></td
              >
              <td class="font-semibold">{order?.customer_name}</td>
              <!-- <td>{order?.fulfillment_channel}</td> -->
              <td>{order?.order_source}</td>
              <td>{order?.carrier === null ? 'Pending' : order?.carrier}</td>
              <td>{order?.tracking_number === null ? 'Pending' : order?.tracking_number}</td>
              <td>
                <button
                  class={order?.status === 'Shipped'
                    ? 'btn btn-accent btn-xs md:btn-sm'
                    : 'btn btn-warning btn-xs md:btn-sm'}>{order?.status}</button
                >
              </td>
              <td>{order?.total_unit_quantity}</td>
              <td>{formatDollarValue(order?.total_paid)}</td>
              <td>
                <div class="flex space-x-2">
                  <a class="btn btn-outline btn-sm" href="/app/orders/{order?.id}" target="_blank"
                    >View</a
                  >
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination controls -->
    <div class="mt-4 flex items-center justify-between">
      <div>
        <span
          >Showing {($currentPage - 1) * $pageSize + 1} to {Math.min(
            $currentPage * $pageSize,
            $totalOrdersCount,
          )} of {$totalOrdersCount} items</span
        >
      </div>
      <div class="join">
        <button
          class="btn join-item btn-sm"
          disabled={$currentPage === 1}
          onclick={() => goToPage($currentPage - 1)}
        >
          «
        </button>
        {#each generatePageNumbers() as pageNum}
          <button
            class="btn join-item btn-sm {pageNum === $currentPage ? 'btn-active' : ''}"
            onclick={() => handlePageClick(pageNum)}
          >
            {pageNum}
          </button>
        {/each}
        <button
          class="btn join-item btn-sm"
          disabled={$currentPage === getTotalPages() || getTotalPages() === 0}
          onclick={() => goToPage($currentPage + 1)}
        >
          »
        </button>
      </div>
    </div>
  </div>
</div>
