<script>
  import { onMount } from 'svelte'
  import {
    products,
    loadProducts,
    currentPage,
    pageSize,
    totalProductCount,
    searchQuery,
    totalInventoryValue,
  } from '$lib/stores/products.js'
  import { users, loadUsers } from '$lib/stores/users.js'
  import { loadBrandSkuMapping } from '$lib/stores/brandSkuMapping.js'

  // Import utility functions
  import { formatDollarValue, findBrandNameByBrandId } from '$lib/utils'

  let { data } = $props()

  // Get brandId from session
  let brandId = $derived(data?.session?.user?.email)
  let brandName = $derived(findBrandNameByBrandId($users, brandId))

  // Product fields
  let is3plCustomerProduct = $state(true)
  let imageUrl = $state('')
  let name = $state('')
  let sku = $state('')
  let asin = $state('')
  let price = $state(0)
  let b2bPrice = $state(0)
  let costOfGood = $state(0)
  let pendingQuantity = $state(0)
  let quantity = $state(0)
  let projectedPoQuantity = $state(0)
  let fbaFee = $state(0)
  let expirationDate = $state(null)
  let lotNumber = $state('')
  let upcCode = $state('')
  let notes = $state('')

  function resetProductFields() {
    is3plCustomerProduct = true
    imageUrl = ''
    name = ''
    sku = ''
    asin = ''
    price = 0
    b2bPrice = 0
    costOfGood = 0
    pendingQuantity = 0
    quantity = 0
    projectedPoQuantity = 0
    fbaFee = 0
    expirationDate = null
    lotNumber = ''
    upcCode = ''
    notes = ''
  }

  let showAddProductModal = $state(false)

  async function addProduct() {
    const response = await fetch('/app/api/products/create-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_3pl_customer_product: is3plCustomerProduct,
        image_url: imageUrl,
        brand_name: brandName,
        brand_id: brandId,
        name,
        sku,
        asin,
        b2b_price: b2bPrice,
        price,
        cost_of_good: costOfGood,
        pending_quantity: pendingQuantity,
        quantity,
        projected_po_quantity: projectedPoQuantity,
        fba_fee: fbaFee,
        expiration_date: expirationDate,
        lot_number: lotNumber,
        upc_code: upcCode,
        notes,
      }),
    })
    if (response.ok) {
      await loadProducts(data.supabase, brandId)
      const product = await response.json()
      const productId = product.data[0].id
      await createBrandSkuMapping(productId, sku, asin, brandId, brandName, name, imageUrl)
      showAddProductModal = false
      resetProductFields()
    } else {
      const errorData = await response.json()
      console.error(errorData)
      alert(`Failed to add product: ${errorData.message}`)
    }
  }

  /**
   * @param {any} productId
   * @param {any} sku
   * @param {any} asin
   * @param {any} brandId
   * @param {any} brandName
   * @param {any} name
   * @param {any} imageUrl
   */
  async function createBrandSkuMapping(productId, sku, asin, brandId, brandName, name, imageUrl) {
    const response = await fetch('/app/api/brand-sku-mapping/create-sku', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        brand_id: brandId,
        brand_name: brandName,
        sku,
        asin,
        name,
        quantity_to_deduct: 1,
        image_url: imageUrl,
      }),
    })
    if (response.ok) {
      await loadBrandSkuMapping(data.supabase)
    } else {
      const errorData = await response.json()
      console.error(errorData)
      alert(`Failed to create brand sku mapping: ${errorData.message}`)
    }
  }

  let productToDelete = $state(/** @type {any} */ ({}))
  let showDeleteProductModal = $state(false)

  /**
   * @param {any} id
   */
  async function deleteProduct(id) {
    const response = await fetch(`/app/api/products/delete-product`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
      }),
    })
    if (response.ok) {
      await loadProducts(data.supabase, brandId)
      showDeleteProductModal = false
    } else {
      const errorData = await response.json()
      console.error(errorData)
      alert(`Failed to delete product: ${errorData.message}`)
    }
  }

  /**
   * @param {any} product
   */
  function setProductFields(product) {
    is3plCustomerProduct = product?.is_3pl_customer_product
    imageUrl = product?.image_url
    name = product?.name
    sku = product?.sku
    asin = product?.asin
    price = product?.price
    b2bPrice = product?.b2b_price
    pendingQuantity = product?.pending_quantity
    expirationDate = product?.expiration_date
    lotNumber = product?.lot_number
    costOfGood = product?.cost_of_good
    quantity = product?.quantity
    projectedPoQuantity = product?.projected_po_quantity
    fbaFee = product?.fba_fee
    upcCode = product?.upc_code
    notes = product?.notes
  }

  let productToEdit = $state(/** @type {any} */ ({}))
  let showEditProductModal = $state(false)

  /**
   * @param {any} event
   */
  async function editProduct(event) {
    event.preventDefault()
    const response = await fetch('/app/api/products/edit-product', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: productToEdit.id,
        is_3pl_customer_product: is3plCustomerProduct,
        image_url: imageUrl,
        brand_name: brandName,
        brand_id: brandId,
        name,
        sku,
        asin,
        price,
        b2b_price: b2bPrice,
        cost_of_good: costOfGood,
        pending_quantity: pendingQuantity,
        quantity,
        projected_po_quantity: projectedPoQuantity,
        fba_fee: fbaFee,
        expiration_date: expirationDate,
        lot_number: lotNumber,
        upc_code: upcCode,
        notes,
      }),
    })
    if (response.ok) {
      await loadProducts(data.supabase, brandId)
      showEditProductModal = false
    } else {
      const errorData = await response.json()
      console.error(errorData)
      alert(`Failed to edit product: ${errorData.message}`)
    }
  }

  // Pagination controls
  const pageSizeOptions = [50, 100, 250, 500, 1000]

  /**
   * Handle search input and trigger search when Enter is pressed
   * @param {KeyboardEvent} event
   */
  async function handleSearchKeyDown(event) {
    if (event.key === 'Enter') {
      $currentPage = 1 // Reset to first page when searching
      await loadProducts(data.supabase, brandId)
    }
  }

  /**
   * Handle the search button click
   */
  async function handleSearch() {
    $currentPage = 1 // Reset to first page when searching
    await loadProducts(data.supabase, brandId)
  }

  /**
   * @param {number} page
   */
  async function goToPage(page) {
    $currentPage = page
    await loadProducts(data.supabase, brandId)
  }

  /**
   * @param {number} size
   */
  async function changePageSize(size) {
    $pageSize = size
    $currentPage = 1 // Reset to first page on page size change
    await loadProducts(data.supabase, brandId)
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
    return Math.ceil($totalProductCount / $pageSize)
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

  // Sort products alphabetically
  let productsAlphabetized = $derived($products.sort((a, b) => a?.name?.localeCompare(b?.name)))

  // Execute onMount
  onMount(async () => {
    if (brandId) {
      await loadProducts(data.supabase, brandId)
      await loadUsers(data.supabase)
    }
  })
</script>

<div class="mt-10 flex justify-center">
  <div class="ml-10 mr-10 w-full max-w-full overflow-hidden rounded-lg bg-base-100 p-4 shadow-xl">
    <h1 class="mb-5 text-center text-3xl font-bold">{brandName} - Products</h1>

    <!-- Button and pagination controls in separate, centered div -->
    <div class="mb-4 flex flex-col items-center gap-4">
      <!-- Add Product button in its own centered container -->
      <div class="w-full text-center">
        <button
          onclick={() => {
            resetProductFields()
            showAddProductModal = true
          }}
          class="btn btn-outline btn-primary btn-sm mr-1"
          >Add Product <i class="fas fa-plus"></i>
        </button>
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

    <!-- Total Inventory Value Display -->
    <!-- <div class="mb-6 mt-4 text-center">
      <div class="stats shadow">
        <div class="stat">
          <div class="stat-title">Total Inventory Value</div>
          <div class="text-primary stat-value">{formatDollarValue($totalInventoryValue)}</div>
          <div class="stat-desc">Based on current search results</div>
        </div>
      </div>
    </div> -->

    <!-- This div makes the table horizontally scrollable -->
    <div class="w-full overflow-x-auto">
      <table class="table table-zebra min-w-[1000px]">
        <thead>
          <tr>
            <th>Product Image</th>
            <th>Name</th>
            <th>Sku</th>
            <th>Asin</th>
            <!-- <th>Cost Of Good</th> -->
            <!-- <th>B2B Price</th> -->
            <th>Price</th>
            <th>Quantity</th>
            <th>Pending Quantity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each productsAlphabetized as product}
            <tr>
              <td>
                <img
                  class="h-12 w-12 rounded-md object-cover shadow-md"
                  alt="Product"
                  src={product.image_url === null ? '/placeholder-image.jpg' : product.image_url}
                />
              </td>
              <td>{product?.name}</td>
              <td
                ><a
                  href={`/app/products/${product?.id}`}
                  class="link-primary font-semibold underline">{product?.sku}</a
                ></td
              >
              <td>
                {#if product?.asin === null}{:else}
                  <a
                    href={`https://www.amazon.com/dp/${product?.asin}`}
                    target="_blank"
                    class="link-primary font-semibold underline">{product?.asin}</a
                  >
                {/if}
              </td>
              <!-- <td>{formatDollarValue(product?.cost_of_good)}</td> -->
              <!-- <td>{formatDollarValue(product?.b2b_price)}</td> -->
              <td>{formatDollarValue(product?.price)}</td>
              <td>{product?.quantity}</td>
              <td>{product?.pending_quantity}</td>
              <td>
                <div class="flex space-x-2">
                  <button
                    onclick={() => {
                      setProductFields(product)
                      productToEdit = product
                      showEditProductModal = true
                    }}
                    class="btn btn-info btn-sm"
                    >Edit
                  </button>
                  <button
                    onclick={() => {
                      productToDelete = product
                      showDeleteProductModal = true
                    }}
                    class="btn btn-error btn-sm"
                    >Delete
                  </button>
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
            $totalProductCount,
          )} of {$totalProductCount} items</span
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

<!-- ADD PRODUCT MODAL BEGINS -->
<div class={`modal ${showAddProductModal ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      onclick={() => (showAddProductModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <form onsubmit={addProduct}>
      <h3 class="text-center text-xl font-bold">Add New Product</h3>

      {#if imageUrl !== ''}
        <div class="mt-4 flex justify-center">
          <img src={imageUrl} alt="product thumbnail" class="h-20 w-20" />
        </div>
      {/if}

      <div class="form-control mt-2">
        <label class="label" for="sku">Image Url</label>
        <input
          type="text"
          placeholder="Product Image Url"
          bind:value={imageUrl}
          class="input input-bordered mb-2 bg-base-200"
        />
      </div>
      <div class="form-control mt-2">
        <label class="label" for="name">Name (required)</label>
        <input
          type="text"
          placeholder="Name"
          bind:value={name}
          class="input input-bordered mb-2 bg-base-200"
          required
        />
      </div>
      <div class="form-control mt-2">
        <label class="label" for="sku">Sku (required)</label>
        <input
          type="text"
          placeholder="Sku"
          bind:value={sku}
          class="input input-bordered mb-2 bg-base-200"
          required
        />
      </div>
      <div class="form-control mt-2">
        <label class="label" for="asin">Asin</label>
        <input
          type="text"
          placeholder="Asin"
          bind:value={asin}
          class="input input-bordered mb-2 bg-base-200"
        />
      </div>
      <div class="form-control mt-2">
        <label class="label" for="upcCode">UPC Code</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="upcCode"
          bind:value={upcCode}
          placeholder="UPC Code"
        />
      </div>
      <!-- <div class="form-control mt-2">
        <label class="label" for="b2b_price">B2B Price</label>
        <input
          class="input input-bordered bg-base-200"
          type="number"
          id="b2b_price"
          bind:value={b2bPrice}
          step="0.01"
          placeholder="0"
          inputmode="decimal"
        />
      </div> -->
      <!-- <div class="form-control mt-2">
        <label class="label" for="price">Price</label>
        <input
          class="input input-bordered bg-base-200"
          type="number"
          id="price"
          bind:value={price}
          step="0.01"
          placeholder="0"
          inputmode="decimal"
        />
      </div> -->
      <!-- <div class="form-control mt-2">
        <label class="label" for="cost_of_good">Cost Of Good</label>
        <input
          class="input input-bordered bg-base-200"
          type="number"
          id="costOfShipment"
          bind:value={costOfGood}
          step="0.01"
          placeholder="0"
          inputmode="decimal"
        />
      </div> -->
      <!-- <div class="form-control mt-2">
        <label class="label" for="pending_quantity">Pending Quantity</label>
        <input
          class="input input-bordered bg-base-200"
          type="number"
          id="pending_quantity"
          bind:value={pendingQuantity}
          placeholder="0"
        />
      </div> -->
      <!-- <div class="form-control mt-2">
        <label class="label" for="quantity">Quantity</label>
        <input
          class="input input-bordered bg-base-200"
          type="number"
          id="quantity"
          bind:value={quantity}
          placeholder="0"
        />
      </div> -->
      <!-- <div class="form-control mt-2">
        <label class="label" for="projected_po_quantity">Projected PO Quantity</label>
        <input
          class="input input-bordered bg-base-200"
          type="number"
          id="projectedPoQuanntity"
          bind:value={projectedPoQuantity}
          placeholder="0"
        />
      </div> -->
      <div class="form-control mt-2">
        <label class="label" for="fbaFee">FBA Fee</label>
        <input
          class="input input-bordered bg-base-200"
          type="number"
          id="fbaFee"
          bind:value={fbaFee}
          step="0.01"
          placeholder="0"
          inputmode="decimal"
        />
      </div>
      <div class="form-control mt-2">
        <label class="label" for="expirationDate">Expiration Date</label>
        <input
          class="input input-bordered bg-base-200"
          type="date"
          id="expirationDate"
          bind:value={expirationDate}
        />
      </div>
      <div class="form-control mt-2">
        <label class="label" for="lotNumber">Lot Number</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="lotNumber"
          bind:value={lotNumber}
          placeholder="Lot Number"
        />
      </div>
      <div class="form-control mt-2">
        <label class="label" for="notes">Notes</label>
        <textarea
          class="textarea textarea-bordered bg-base-200"
          id="notes"
          bind:value={notes}
          placeholder="Additional notes about this product..."
        ></textarea>
      </div>
      <div class="mt-4 flex justify-center">
        <button class="btn btn-primary" type="submit">Submit</button>
      </div>
    </form>
  </div>
</div>
<!-- ADD PRODUCT MODAL ENDS -->

<!-- DELETE PRODUCT MODAL BEGINS -->
<div class={`modal ${showDeleteProductModal ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      onclick={() => (showDeleteProductModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mt-2 text-center text-lg font-bold">
      Are you sure you want to delete this product?
    </h1>
    <p class="mt-4 text-center">
      <span class="font-semibold">{productToDelete?.sku}</span>
    </p>
    <div class="mt-4 flex justify-center">
      <img src={productToDelete?.image_url} alt="product thumbnail" class="h-20 w-20" />
    </div>
    <div class="mt-6 flex justify-center">
      <button onclick={() => deleteProduct(productToDelete?.id)} class="btn btn-error"
        >Delete</button
      >
    </div>
  </div>
</div>
<!-- DELETE PRODUCT MODAL ENDS -->

<!-- EDIT PRODUCT MODAL BEGINS -->
<div class={`modal ${showEditProductModal ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      onclick={() => (showEditProductModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <form onsubmit={editProduct}>
      <h3 class="text-center text-xl font-bold">Edit Product</h3>

      <div class="mt-4 flex justify-center">
        <img src={productToEdit?.image_url} alt="product thumbnail" class="h-20 w-20" />
      </div>

      <div class="form-control mt-2">
        <label class="label" for="sku">Image Url</label>
        <input
          type="text"
          placeholder="Product Image Url"
          bind:value={imageUrl}
          class="input input-bordered mb-2 bg-base-200"
        />
      </div>
      <div class="form-control mt-2">
        <label class="label" for="sku">Name</label>
        <input
          type="text"
          placeholder="Name"
          bind:value={name}
          class="input input-bordered mb-2 bg-base-200"
          required
        />
      </div>
      <div class="form-control mt-2">
        <label class="label" for="sku">Sku</label>
        <input
          type="text"
          placeholder="Sku"
          bind:value={sku}
          class="input input-bordered mb-2 bg-base-200"
          required
        />
      </div>
      <div class="form-control mt-2">
        <label class="label" for="asin">Asin</label>
        <input
          type="text"
          placeholder="Asin"
          bind:value={asin}
          class="input input-bordered mb-2 bg-base-200"
        />
      </div>
      <div class="form-control mt-2">
        <label class="label" for="upcCode">UPC Code</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="upcCode"
          bind:value={upcCode}
          placeholder="UPC Code"
        />
      </div>
      <div class="form-control mt-2">
        <label class="label" for="b2bPrice">B2B Price</label>
        <input
          class="input input-bordered bg-base-200"
          type="number"
          id="b2bPrice"
          bind:value={b2bPrice}
          step="0.01"
          placeholder="0"
          inputmode="decimal"
        />
      </div>
      <div class="form-control mt-2">
        <label class="label" for="asin">Price</label>
        <input
          class="input input-bordered bg-base-200"
          type="number"
          id="price"
          bind:value={price}
          step="0.01"
          placeholder="0"
          inputmode="decimal"
        />
      </div>
      <div class="form-control mt-2">
        <label class="label" for="asin">Cost Of Good</label>
        <input
          class="input input-bordered bg-base-200"
          type="number"
          id="costOfShipment"
          bind:value={costOfGood}
          step="0.01"
          placeholder="0"
          inputmode="decimal"
        />
      </div>
      <!-- <div class="form-control mt-2">
        <label class="label" for="asin">Quantity</label>
        <input
          class="input input-bordered bg-base-200"
          type="number"
          id="quantity"
          bind:value={quantity}
          placeholder="0"
        />
      </div> -->
      <!-- <div class="form-control mt-2">
        <label class="label" for="pendingQuantity">Pending Quantity</label>
        <input
          class="input input-bordered bg-base-200"
          type="number"
          id="pendingQuantity"
          bind:value={pendingQuantity}
          placeholder="0"
        />
      </div> -->
      <!-- <div class="form-control mt-2">
        <label class="label" for="asin">Projected PO Quantity</label>
        <input
          class="input input-bordered bg-base-200"
          type="number"
          id="projectedPoQuanntity"
          bind:value={projectedPoQuantity}
          placeholder="0"
        />
      </div> -->
      <div class="form-control mt-2">
        <label class="label" for="fbaFee">FBA Fee</label>
        <input
          class="input input-bordered bg-base-200"
          type="number"
          id="fbaFee"
          bind:value={fbaFee}
          step="0.01"
          placeholder="0"
          inputmode="decimal"
        />
      </div>
      <div class="form-control mt-2">
        <label class="label" for="expirationDate">Expiration Date</label>
        <input
          class="input input-bordered bg-base-200"
          type="date"
          id="expirationDate"
          bind:value={expirationDate}
        />
      </div>
      <div class="form-control mt-2">
        <label class="label" for="lotNumber">Lot Number</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="lotNumber"
          bind:value={lotNumber}
          placeholder="Lot Number"
        />
      </div>
      <div class="form-control mt-2">
        <label class="label" for="notes">Notes</label>
        <textarea
          class="textarea textarea-bordered bg-base-200"
          id="notes"
          bind:value={notes}
          placeholder="Additional notes about this product..."
        ></textarea>
      </div>
      <div class="mt-4 flex justify-center">
        <button class="btn btn-primary" type="submit">Save</button>
      </div>
    </form>
  </div>
</div>
<!-- EDIT PRODUCT MODAL ENDS -->
