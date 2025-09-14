<script>
  import { onMount } from 'svelte'
  import {
    inventoryChangelog,
    loadInventoryChangelog,
    currentPage,
    pageSize,
    totalChangelogCount,
    searchQuery,
  } from '$lib/stores/inventoryChangelog'
  import { formatTimeStampForChangelog, abbreviateString } from '$lib/utils'

  let { data } = $props()

  // Pagination controls
  const pageSizeOptions = [50, 100, 250, 500, 1000]

  /**
   * Handle search input and trigger search when Enter is pressed
   * @param {KeyboardEvent} event
   */
  async function handleSearchKeyDown(event) {
    if (event.key === 'Enter') {
      $currentPage = 1 // Reset to first page when searching
      await loadInventoryChangelog(data.supabase)
    }
  }

  /**
   * Handle the search button click
   */
  async function handleSearch() {
    $currentPage = 1 // Reset to first page when searching
    await loadInventoryChangelog(data.supabase)
  }

  /**
   * @param {number} page
   */
  async function goToPage(page) {
    $currentPage = page
    await loadInventoryChangelog(data.supabase)
  }

  /**
   * @param {number} size
   */
  async function changePageSize(size) {
    $pageSize = size
    $currentPage = 1 // Reset to first page on page size change
    await loadInventoryChangelog(data.supabase)
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
    return Math.ceil($totalChangelogCount / $pageSize)
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

  let hoveredItem = null

  function handleMouseEnter(id) {
    hoveredItem = id
  }

  function handleMouseLeave() {
    hoveredItem = null
  }

  onMount(async () => {
    await loadInventoryChangelog(data.supabase)
  })
</script>

<div class="mt-10 flex justify-center">
  <div class="ml-10 mr-10 w-full max-w-full overflow-hidden rounded-lg bg-base-100 p-4 shadow-xl">
    <h1 class="mb-5 text-center text-3xl font-bold">Inventory Changelog</h1>

    <!-- Search and pagination controls -->
    <div class="mb-4 flex flex-col items-center gap-4">
      <!-- Search bar -->
      <div class="flex w-full max-w-sm items-center">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          class="input input-bordered w-full bg-base-200"
          bind:value={$searchQuery}
          onkeydown={handleSearchKeyDown}
        />
        <button
          class="btn btn-square btn-primary"
          onclick={handleSearch}
          aria-label="Search changelog"
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

      <!-- Page size selector -->
      <div class="flex items-center gap-2">
        <span class="font-semibold">Page Size:</span>
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

    <div class="w-full overflow-x-auto">
      <table class="table table-zebra min-w-[1000px]">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Product Image</th>
            <th>Shipmement #</th>
            <th>Change Source</th>
            <th>Name</th>
            <th>Sku</th>
            <th>Previous Quantity</th>
            <th>New Quantity</th>
            <th>Net Change</th>
          </tr>
        </thead>
        <tbody>
          {#each $inventoryChangelog as log}
            <tr>
              <td>{formatTimeStampForChangelog(log?.created_at)}</td>
              <td>
                <img
                  class="h-12 w-12 rounded-md object-cover shadow-md"
                  alt={log?.name || 'Product thumbnail'}
                  src={log.image_url === null ? '/placeholder-image.jpg' : log.image_url}
                />
              </td>
              <td>{log?.order_number === null ? 'N/A' : log?.order_number}</td>
              <td>{log?.change_source}</td>
              <td>
                <div
                  role="tooltip"
                  class="relative"
                  onmouseenter={() => handleMouseEnter(log.id || log.sku || log.name)}
                  onmouseleave={handleMouseLeave}
                >
                  {abbreviateString(log?.name, 25)}
                  {#if hoveredItem === (log.id || log.sku || log.name)}
                    <div
                      class="absolute left-0 top-full z-50 mt-2 rounded-lg bg-gray-200 p-2 text-gray-800 shadow-lg"
                      style="min-width: 200px; white-space: normal;"
                    >
                      {log?.name}
                    </div>
                  {/if}
                </div>
              </td>
              <td>{log?.sku}</td>
              <td>{log?.previous_quantity}</td>
              <td>{log?.new_quantity}</td>
              <td
                class:text-green-600={log?.new_quantity - log?.previous_quantity > 0}
                class:text-error={log?.new_quantity - log?.previous_quantity < 0}
                >{log?.new_quantity - log?.previous_quantity}</td
              >
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
            $totalChangelogCount,
          )} of {$totalChangelogCount} items</span
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
