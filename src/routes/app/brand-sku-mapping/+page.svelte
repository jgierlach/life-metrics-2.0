<script>
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import {
    brandSkuMapping,
    loadBrandSkuMapping,
    currentPage,
    pageSize,
    totalSkuCount,
    searchQuery,
    brandFilter,
  } from '$lib/stores/brandSkuMapping.js'
  import { users, loadUsers } from '$lib/stores/users.js'
  import { unmappedSkus, loadUnmappedSkus } from '$lib/stores/unmappedSkus.js'
  let { data } = $props()

  let brandName = $state('')
  let brandId = $derived($users.find((user) => user?.name === brandName)?.email)
  let sku = $state('')
  let asin = $state('')
  let name = $state('')
  let quantityToDeduct = $state(1)
  let productImageUrl = $state('')
  let productId = $state(0)

  let brandNames = $derived($users.map((user) => user?.name))

  // Set type for skuToEdit and skuToDelete
  let skuToEdit = $state(/** @type {any} */ ({}))
  let skuToDelete = $state(/** @type {any} */ ({}))

  function resetSkuFields() {
    brandName = ''
    sku = ''
    asin = ''
    name = ''
    quantityToDeduct = 1
    productImageUrl = ''
    productId = 0
  }

  let showAddSkuModal = $state(false)
  async function addSku() {
    // See if any skus in the unmapped skus array match the skus that's passed in. If it does delete that sku automatically
    const skuToDelete = $unmappedSkus.find((unmappedSku) => unmappedSku?.sku === sku)
    if (skuToDelete) {
      try {
        await deleteUnmappedSku(skuToDelete)
      } catch (error) {
        console.error('Error deleting SKU in addSku function:', error)
      }
    } else {
      console.warn(`SKU ${sku} not found in unmappedSkus.`)
    }

    const response = await fetch('/app/api/brand-sku-mapping/create-sku', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        brand_name: brandName,
        brand_id: brandId,
        sku,
        asin,
        name,
        quantity_to_deduct: quantityToDeduct,
        product_image_url: productImageUrl,
      }),
    })
    if (response.ok) {
      loadBrandSkuMapping(data.supabase)
      showAddSkuModal = false
      resetSkuFields()
      selectedProduct = null
    } else {
      const errorData = await response.json()
      console.error(errorData)
      alert(`Failed to add sku: ${errorData.message}`)
    }
  }

  let showEditSkuModal = $state(false)
  async function editSku(event) {
    event.preventDefault()
    const response = await fetch('/app/api/brand-sku-mapping/edit-sku', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: skuToEdit?.id,
        product_id: productId,
        brand_name: brandName,
        brand_id: brandId,
        sku,
        asin,
        name,
        quantity_to_deduct: quantityToDeduct,
        product_image_url: productImageUrl,
      }),
    })
    if (response.ok) {
      await loadBrandSkuMapping(data.supabase)
      showEditSkuModal = false
      resetSkuFields()
    } else {
      const errorData = await response.json()
      console.error(errorData)
      alert(`Failed to add sku: ${errorData.message}`)
    }
  }

  let showDeleteSkuModal = $state(false)
  /**
   * @param {any} id
   */
  async function deleteSku(id) {
    const response = await fetch('/app/api/brand-sku-mapping/delete-sku', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
      }),
    })
    if (response.ok) {
      await loadBrandSkuMapping(data.supabase)
      showDeleteSkuModal = false
    } else {
      const errorData = await response.json()
      console.error(errorData)
      alert(`Failed to delete sku', ${errorData.message}`)
    }
  }

  let products = $state([])
  async function fetchProducts() {
    const response = await fetch('/app/api/products/fetch-products')
    const data = await response.json()
    console.log('PRODUCTS', data)
    if (response.ok) {
      return data.body
    } else {
      console.error('Failed to fetch products', data)
    }
  }

  let selectedProduct = $state(/** @type {any} */ (null))

  async function deleteUnmappedSku(sku) {
    // If no sku value is available then delete by id otherwise delete by sku
    if (sku?.sku === '' || sku?.sku === null) {
      const response = await fetch('/app/api/unmapped-skus/delete-sku-by-id', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: sku?.id,
        }),
      })
      if (response.ok) {
        await loadUnmappedSkus(data.supabase)
      } else {
        const error = response.json()
        console.error('Failed to delete sku mapping', error)
      }
    } else {
      const response = await fetch('/app/api/unmapped-skus/delete-sku-by-sku', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sku: sku?.sku,
        }),
      })
      if (response.ok) {
        await loadUnmappedSkus(data.supabase)
      } else {
        const error = response.json()
        console.error('Failed to delete sku mapping', error)
      }
    }
  }

  async function addLineItemToSkip(brandId, brandName, name, sku, id) {
    const response = await fetch('/app/api/line-items-to-skip/create-line-item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brand_id: brandId,
        brand_name: brandName,
        name,
      }),
    })
    if (response.ok) {
      await loadUnmappedSkus(data.supabase)
      await deleteUnmappedSku({ sku, id })
    } else {
      const error = response.json()
      console.error('Failed to add line item to skip', error)
    }
  }

  // Pagination controls
  const pageSizeOptions = [50, 100, 250, 500, 1000]

  /**
   * @param {number} page
   */
  async function goToPage(page) {
    $currentPage = page
    await loadBrandSkuMapping(data.supabase)
  }

  /**
   * @param {number} size
   */
  async function changePageSize(size) {
    $pageSize = size
    $currentPage = 1 // Reset to first page on page size change
    await loadBrandSkuMapping(data.supabase)
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
    return Math.ceil($totalSkuCount / $pageSize)
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

  /**
   * Handle search input and trigger search when Enter is pressed
   * @param {KeyboardEvent} event
   */
  async function handleSearchKeyDown(event) {
    if (event.key === 'Enter') {
      $currentPage = 1 // Reset to first page when searching
      await loadBrandSkuMapping(data.supabase)
    }
  }

  /**
   * Handle the search button click
   */
  async function handleSearch() {
    $currentPage = 1 // Reset to first page when searching
    await loadBrandSkuMapping(data.supabase)
  }

  // Execute onMount
  onMount(async () => {
    await loadBrandSkuMapping(data.supabase)
    await loadUsers(data.supabase)
    await loadUnmappedSkus(data.supabase)
    products = await fetchProducts()
  })
</script>

{#if $unmappedSkus?.length > 0}
  <div class="mt-4 flex justify-center px-2 sm:px-4 md:mt-10">
    <div class="w-full max-w-5xl rounded-lg bg-base-100 p-2 shadow-xl sm:p-4">
      <div class="flex items-center justify-center text-xl font-semibold sm:text-2xl">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 flex-shrink-0 stroke-current text-yellow-400 sm:h-6 sm:w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10.29 3.86l-6.4 11A1 1 0 004 16h16a1 1 0 00.86-1.49l-6.4-11a1 1 0 00-1.72 0zM12 9v4m0 4h.01"
          ></path>
        </svg>
        <span class="ml-2">Warning! You have unmapped skus.</span>
      </div>

      <!-- Table for medium screens and up -->
      <div class="mt-4 hidden overflow-x-auto md:block">
        <table class="table w-full shadow-lg">
          <thead>
            <tr>
              <th>Product Image</th>
              <th>Order Number</th>
              <th>Sku</th>
              <th>Name</th>
              <th>Order Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each $unmappedSkus as sku}
              <tr>
                <td>
                  <img
                    src={sku?.image_url === null ? '/placeholder-image.jpg' : sku?.image_url}
                    alt="product thumbnail"
                    class="h-16 w-16 rounded-md object-cover sm:h-20 sm:w-20"
                  />
                </td>
                <td>{sku?.order_number}</td>
                <td>{sku?.sku}</td>
                <td>{sku?.name}</td>
                <td>{sku?.order_source}</td>
                <td>
                  <button
                    onclick={() =>
                      addLineItemToSkip(
                        sku?.brand_id,
                        sku?.brand_name,
                        sku?.name,
                        sku?.sku,
                        sku?.id,
                      )}
                    class="btn btn-info btn-sm mb-2">Ignore</button
                  >
                  <button onclick={() => deleteUnmappedSku(sku)} class="btn btn-error btn-sm"
                    >Delete</button
                  ></td
                >
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Card layout for small screens -->
      <div class="mt-4 grid grid-cols-1 gap-4 md:hidden">
        {#each $unmappedSkus as sku}
          <div class="card bg-base-200 shadow-md">
            <div class="card-body p-4">
              <div class="flex items-center gap-4">
                <img
                  src={sku?.image_url === null ? '/placeholder-image.jpg' : sku?.image_url}
                  alt="product thumbnail"
                  class="h-16 w-16 rounded-md object-cover"
                />
                <div>
                  <h3 class="text-md font-bold">{sku?.name || 'No name'}</h3>
                  <p class="text-sm">SKU: {sku?.sku}</p>
                </div>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-2">
                <div class="text-sm">
                  Shipment: <span class="font-semibold">{sku?.shipment_number}</span>
                </div>
                <div class="text-sm">
                  Source: <span class="font-semibold">{sku?.order_source}</span>
                </div>
              </div>

              <div class="mt-3 flex justify-end">
                <button onclick={() => deleteUnmappedSku(sku)} class="btn btn-error btn-sm"
                  >Delete</button
                >
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<!-- CREATE SKU MAPPING FORM BEGINS -->
{#if showAddSkuModal}
  <div class="mt-4 flex justify-center px-2 sm:px-4 md:mt-10">
    <div
      id="create-sku-mapping"
      class="w-full max-w-2xl rounded-lg bg-base-100 p-2 shadow-xl sm:p-4"
    >
      <h1 class="text-center text-2xl font-bold sm:text-3xl">Create Sku Mapping</h1>
      <form onsubmit={addSku} class="mt-4 p-2 shadow-md sm:p-4">
        <div class="mt-4">
          <label for="productImageUrl" class="block">Product Image Url</label>
          <input
            type="text"
            id="productImageUrl"
            class="input input-bordered w-full bg-base-200"
            bind:value={productImageUrl}
            required
          />
        </div>
        <div class="mt-4">
          <label for="sku" class="block">Sku Map</label>
          <input
            type="text"
            id="sku"
            class="input input-bordered w-full bg-base-200"
            bind:value={sku}
            oninput={() => (sku = sku.trim())}
            required
          />
        </div>
        <div class="mt-4">
          <label for="quantityToDeduct" class="block">Quantity To Deduct</label>
          <input
            type="number"
            id="quantityToDeduct"
            class="input input-bordered w-full bg-base-200"
            bind:value={quantityToDeduct}
            required
          />
        </div>
        <div class="mt-4">
          <label for="name" class="block">Name</label>
          <input
            type="text"
            id="name"
            class="input input-bordered w-full bg-base-200"
            value={name}
            required
          />
        </div>
        <div class="mt-4">
          <label for="asin" class="block">Asin</label>
          <input
            type="text"
            id="asin"
            class="input input-bordered w-full bg-base-200"
            bind:value={asin}
            required
          />
        </div>
        <div class="mt-4">
          <label for="BrandName" class="block">Brand Name</label>
          <input
            type="text"
            id="brandName"
            class="input input-bordered w-full bg-base-200"
            value={brandName}
            required
          />
        </div>
        <div class="mt-4">
          <label for="BrandId" class="block">Brand Id</label>
          <input
            type="text"
            id="brandId"
            class="input input-bordered w-full bg-base-200"
            value={brandId}
            required
          />
        </div>
        <div class="mt-4">
          <label for="productId" class="block">Product Id</label>
          <input
            type="number"
            id="productId"
            class="input input-bordered w-full bg-base-200"
            value={productId}
            required
          />
        </div>
        <div class="mt-4 flex justify-center">
          <button
            class="btn btn-error"
            onclick={() => {
              showAddSkuModal = false
              selectedProduct = null
            }}>Cancel</button
          >
          <button type="submit" class="btn btn-primary ml-4">Create</button>
        </div>
      </form>
    </div>
  </div>
{/if}
<!-- CREATE SKU MAPPING FORM ENDS -->

<!-- SELECTED PRODUCT SECTION BEGINS -->
{#if selectedProduct !== null}
  <div id="selected-product" class="mt-4 flex justify-center px-2 sm:px-4 md:mt-10">
    <div class="w-full max-w-4xl rounded-lg bg-base-100 p-2 shadow-xl sm:p-4">
      <h1 class="text-center text-2xl font-bold sm:text-3xl">Selected Product</h1>
      <div class="flex justify-center">
        <button onclick={() => (selectedProduct = null)} class="btn btn-outline btn-sm mt-4"
          >Reset</button
        >
      </div>

      <!-- Table for medium screens and up -->
      <div class="mt-4 hidden overflow-x-auto md:block">
        <table class="table w-full shadow-lg">
          <thead>
            <tr>
              <th>Product Image</th>
              <th>Brand Name</th>
              <th>Sku</th>
              <th>Name</th>
              <th>Product Id</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <img
                  src={selectedProduct?.image_url}
                  alt="selectedProduct thumbnail"
                  class="h-16 w-16 rounded-md object-cover sm:h-20 sm:w-20"
                />
              </td>
              <td>{selectedProduct?.brand_name}</td>
              <td>{selectedProduct?.sku}</td>
              <td>{selectedProduct?.name}</td>
              <td>{selectedProduct?.id}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Card for small screens -->
      <div class="mt-4 md:hidden">
        <div class="card bg-base-200 shadow-md">
          <div class="card-body p-4">
            <div class="flex items-center gap-4">
              <img
                src={selectedProduct?.Product_Image_Url}
                alt="selectedProduct thumbnail"
                class="h-16 w-16 rounded-md object-cover"
              />
              <div>
                <h3 class="text-md font-bold">{selectedProduct?.name}</h3>
                <p class="text-sm">SKU: {selectedProduct?.sku}</p>
              </div>
            </div>

            <div class="mt-3 grid grid-cols-2 gap-2">
              <div class="text-sm">
                Product ID: <span class="font-semibold">{selectedProduct?.id}</span>
              </div>
              <div class="text-sm">
                Brand ID: <span class="font-semibold">{selectedProduct?.brand_id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
<!-- SELECTED PRODUCT SECTION ENDS -->

<!-- BRAND SKU MAPPING TABLE BEGINS -->
{#if !showAddSkuModal}
  <div class="mt-10 flex justify-center">
    <div class="ml-10 mr-10 w-full rounded-lg bg-base-100 p-4 shadow-xl">
      <h1 class="mb-5 text-center text-3xl font-bold">Brand Sku Mapping</h1>

      <!-- Button and pagination controls in separate, centered div -->
      <div class="mb-4 flex flex-col items-center gap-4">
        <!-- Add Sku button in its own centered container -->
        <div class="w-full text-center">
          <button
            onclick={() => {
              resetSkuFields()
              showAddSkuModal = true
            }}
            class="btn btn-outline btn-primary btn-sm"
            >Add Sku Mapping <i class="fas fa-plus"></i></button
          >
        </div>

        <!-- Search bar -->
        <div class="flex w-full max-w-sm items-center">
          <input
            type="text"
            placeholder="Search by name, SKU or ASIN..."
            class="input input-bordered w-full bg-base-200"
            bind:value={$searchQuery}
            onkeydown={handleSearchKeyDown}
          />
          <button
            class="btn btn-square btn-primary"
            onclick={handleSearch}
            aria-label="Search brand sku mapping"
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

        <!-- Brand filter dropdown -->
        <div class="flex items-center gap-2">
          <span class="font-semibold">Brand:</span>
          <select
            class="select select-bordered select-sm"
            bind:value={$brandFilter}
            onchange={() => handleSearch()}
          >
            <option value="All Brands">All Brands</option>
            {#each brandNames as name}
              <option value={name}>{name}</option>
            {/each}
          </select>
        </div>

        <!-- Page size selector in its own container -->
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

      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Product Image</th>
              <th>Brand Name</th>
              <th>Sku</th>
              <th>Name</th>
              <th>Quantity To Deduct</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each $brandSkuMapping as skuMap}
              <tr>
                <td>
                  <img src={skuMap?.image_url} alt="sku map" class="h-10 w-10" />
                </td>
                <td class="font-semibold">{skuMap?.brand_name}</td>
                <td>{skuMap?.sku}</td>
                <td>{skuMap?.name}</td>
                <td>{skuMap?.quantity_to_deduct}</td>
                <td
                  ><div class="flex space-x-2">
                    <button
                      onclick={() => {
                        skuToEdit = skuMap
                        // setSkuFields(skuMap)
                        brandName = skuMap?.brand_name
                        sku = skuMap?.sku
                        asin = skuMap?.asin
                        name = skuMap?.name
                        quantityToDeduct = skuMap?.quantity_to_deduct
                        productImageUrl = skuMap?.image_url
                        productId = skuMap?.id
                        showEditSkuModal = true
                      }}
                      class="btn btn-info btn-sm">Edit</button
                    >
                    <button
                      onclick={() => {
                        showDeleteSkuModal = true
                        skuToDelete = skuMap
                      }}
                      class="btn btn-error btn-sm">Delete</button
                    >
                  </div></td
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
              $totalSkuCount,
            )} of {$totalSkuCount} items</span
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
{/if}
<!-- BRAND SKU MAPPING TABLE ENDS -->

<!-- PRODUCTS TABLE BEGINS -->
{#if showAddSkuModal}
  <div class="mt-10 flex justify-center">
    <div class="ml-10 mr-10 w-full rounded-lg bg-base-100 p-4 shadow-xl">
      <h1 class="mb-5 text-center text-3xl font-bold">Products</h1>
      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Product Image</th>
              <th>Brand Name</th>
              <th>Sku</th>
              <th>Asin</th>
              <th>Name</th>
              <th>Product Id</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each products as product}
              <tr>
                <td>
                  <img src={product?.image_url} alt="product" class="h-10 w-10" />
                </td>
                <td class="font-semibold">{product?.brand_name}</td>
                <td>{product?.sku}</td>
                <td>{product?.asin}</td>
                <td>{product?.name}</td>
                <td>{product?.id}</td>
                <td
                  ><div class="flex space-x-2">
                    <button
                      onclick={() => {
                        selectedProduct = product
                        productImageUrl = product?.image_url
                        brandName = product?.brand_name
                        asin = product?.asin
                        name = product?.name
                        productId = product?.id
                        goto('/app/brand-sku-mapping/#selected-product')
                      }}
                      class="btn btn-outline">Select</button
                    >
                  </div></td
                >
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
{/if}
<!-- PRODUCTS TABLE ENDS -->

<!-- EDIT SKU MODAL BEGINS -->
<div class={`modal ${showEditSkuModal ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      onclick={() => (showEditSkuModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <form onsubmit={editSku}>
      <h3 class="text-center text-xl font-bold">Edit Sku Mapping</h3>
      <div class="form-control mt-4">
        <label class="label" for="productImageUrl">Product Image Url</label>
        <input
          type="text"
          placeholder="Product Image Url"
          bind:value={productImageUrl}
          class="input input-bordered mb-2 bg-base-200"
        />
        <label class="label" for="brandName">Brand Name</label>
        <select class="select select-bordered bg-base-200" bind:value={brandName}>
          {#each brandNames as name}
            <option value={name}>{name}</option>
          {/each}
        </select>
        <label class="label" for="brandId">Brand Id</label>
        <input
          type="text"
          placeholder="Brand Id"
          value={brandId}
          class="input input-bordered mb-2 bg-base-200"
          required
        />
        <label class="label" for="sku">Sku</label>
        <input
          type="text"
          placeholder="Sku"
          bind:value={sku}
          class="input input-bordered mb-2 bg-base-200"
          required
        />
        <label class="label" for="asin">Asin</label>
        <input
          type="text"
          placeholder="Asin"
          bind:value={asin}
          class="input input-bordered mb-2 bg-base-200"
          required
        />
        <label class="label" for="name">Name</label>
        <input
          type="text"
          placeholder="Name"
          bind:value={name}
          class="input input-bordered mb-2 bg-base-200"
        />
        <label class="label" for="quantityToDeduct">Quantity To Deduct</label>
        <input
          type="number"
          placeholder="Quantity To Deduct"
          bind:value={quantityToDeduct}
          class="input input-bordered mb-2 bg-base-200"
        />
        <label class="label" for="productId">Product Id</label>
        <input
          type="number"
          placeholder="Product Id"
          bind:value={productId}
          class="input input-bordered mb-2 bg-base-200"
        />
        <div class="mt-4 flex justify-center">
          <button class="btn btn-primary" type="submit">Save</button>
        </div>
      </div>
    </form>
  </div>
</div>
<!-- EDIT SKU MODAL ENDS -->

<!-- DELETE SKU MODAL BEGINS -->
<div class={`modal ${showDeleteSkuModal ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      onclick={() => (showDeleteSkuModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mt-2 text-center text-lg font-bold">Are you sure you want to delete this?</h1>
    <p class="mt-4 text-center">
      <span class="font-semibold">{skuToDelete?.brand_name}</span> - {skuToDelete?.sku}
    </p>
    <div class="mt-4 flex justify-center">
      <button onclick={() => deleteSku(skuToDelete?.id)} class="btn btn-error">Delete</button>
    </div>
  </div>
</div>
<!-- DELETE SKU MODAL ENDS -->
