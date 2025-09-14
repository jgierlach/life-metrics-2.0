<script>
  import { formatDollarValue, formatReadableDate } from '$lib/utils'
  import { goto } from '$app/navigation'

  /** @type {import('./$types').PageData} */
  let { data } = $props()
  let { product, productImages, session } = data

  console.log('PRODUCT', product)

  // Calculate derived values
  let totalInventoryValue = $derived((product?.quantity || 0) * (product?.cost_of_good || 0))
  let potentialRevenue = $derived((product?.quantity || 0) * (product?.price || 0))
  let grossMargin = $derived(
    product?.price && product?.cost_of_good
      ? ((product.price - product.cost_of_good) / product.price) * 100
      : 0,
  )

  // Mobile collapsible state
  let expandedSections = $state({
    overview: true,
    pricing: false,
    inventory: false,
    details: false,
    metadata: false,
  })

  /**
   * @param {keyof expandedSections} section
   */
  function toggleSection(section) {
    expandedSections[section] = !expandedSections[section]
  }

  function goBack() {
    goto('/app/products')
  }

  /**
   * @param {number} quantity
   */
  function getStatusBadgeClass(quantity) {
    if (quantity <= 0) return 'badge-error'
    if (quantity <= 10) return 'badge-warning'
    return 'badge-success'
  }

  /**
   * @param {number} quantity
   */
  function getQuantityStatus(quantity) {
    if (quantity <= 0) return 'Out of Stock'
    if (quantity <= 10) return 'Low Stock'
    return 'In Stock'
  }
</script>

<svelte:head>
  <title>{product?.name || 'Product Details'} | 3PL Customer Portal</title>
</svelte:head>

<div class="mx-auto max-w-7xl p-4">
  <!-- Header with navigation -->
  <div class="mb-6 flex items-center justify-between">
    <button onclick={goBack} class="btn btn-ghost">
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"
        ></path>
      </svg>
      Back to Products
    </button>

    <div class="breadcrumbs text-sm">
      <ul>
        <li><a href="/app">Dashboard</a></li>
        <li><a href="/app/products">Products</a></li>
        <li>{product?.name || 'Product Details'}</li>
      </ul>
    </div>
  </div>

  <!-- Product Header -->
  <div class="mb-8 rounded-xl bg-base-100 p-6 shadow-lg">
    <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
      <!-- Product Image and Gallery -->
      <div class="flex-shrink-0">
        <div class="mb-4">
          <img
            src={product?.image_url || '/placeholder-image.jpg'}
            alt={product?.name || 'Product'}
            class="h-48 w-48 rounded-lg object-cover shadow-md lg:h-64 lg:w-64"
          />
        </div>

        <!-- Additional Images -->
        {#if productImages && productImages.length > 0}
          <div class="flex flex-wrap gap-2">
            {#each productImages as image}
              <img
                src={image.image_url}
                alt=""
                class="h-16 w-16 rounded-md object-cover shadow-sm"
              />
            {/each}
          </div>
        {/if}
      </div>

      <!-- Product Basic Info -->
      <div class="flex-grow">
        <div class="mb-4">
          <h1 class="text-3xl font-bold text-base-content">{product?.name || 'Product Name'}</h1>
          <p class="mt-2 text-lg text-base-content/70">{product?.brand_name || 'Unknown Brand'}</p>
        </div>

        <!-- Key Stats Row -->
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div class="rounded-lg bg-base-200 p-4 text-center">
            <div class="text-primary text-2xl font-bold">{product?.quantity || 0}</div>
            <div class="text-sm opacity-70">Current Stock</div>
            <div class="mt-1">
              <span class="badge badge-sm {getStatusBadgeClass(product?.quantity)}">
                {getQuantityStatus(product?.quantity)}
              </span>
            </div>
          </div>

          <div class="rounded-lg bg-base-200 p-4 text-center">
            <div class="text-secondary text-2xl font-bold">{formatDollarValue(product?.price)}</div>
            <div class="text-sm opacity-70">Price</div>
          </div>

          <div class="rounded-lg bg-base-200 p-4 text-center">
            <div class="text-2xl font-bold text-accent">
              {formatDollarValue(totalInventoryValue)}
            </div>
            <div class="text-sm opacity-70">Inventory Value</div>
          </div>

          <!-- <div class="rounded-lg bg-base-200 p-4 text-center">
            <div class="text-2xl font-bold text-info">{grossMargin.toFixed(1)}%</div>
            <div class="text-sm opacity-70">Gross Margin</div>
          </div> -->
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content Sections -->
  <div class="grid gap-6 lg:grid-cols-2">
    <!-- Overview & Identification Section -->
    <div class="rounded-xl bg-base-100 shadow-lg">
      <!-- Section Header -->
      <button
        class="flex w-full items-center justify-between p-6 lg:cursor-default"
        onclick={() => toggleSection('overview')}
      >
        <div class="flex items-center">
          <div class="bg-primary mr-3 flex h-10 w-10 items-center justify-center rounded-lg">
            <svg
              class="h-6 w-6 text-primary-content"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z"
              ></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold">Overview & Identification</h3>
        </div>
        <svg
          class="h-5 w-5 transform transition-transform lg:hidden {expandedSections.overview
            ? 'rotate-180'
            : ''}"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </button>

      <!-- Section Content -->
      <div class="px-6 pb-6 {expandedSections.overview || 'hidden lg:block'}">
        <div class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <span class="text-sm font-medium opacity-70">SKU</span>
              <div class="text-lg font-semibold">{product?.sku || 'N/A'}</div>
            </div>
            <div>
              <span class="text-sm font-medium opacity-70">ASIN</span>
              <div class="text-lg font-semibold">
                {#if product?.asin}
                  <a
                    href="https://www.amazon.com/dp/{product.asin}"
                    target="_blank"
                    class="link-primary"
                  >
                    {product.asin}
                  </a>
                {:else}
                  N/A
                {/if}
              </div>
            </div>
            <div>
              <span class="text-sm font-medium opacity-70">UPC Code</span>
              <div class="text-lg font-semibold">{product?.upc_code || 'N/A'}</div>
            </div>
            <div>
              <span class="text-sm font-medium opacity-70">Handle</span>
              <div class="text-lg font-semibold">{product?.handle || 'N/A'}</div>
            </div>
            <div>
              <span class="text-sm font-medium opacity-70">Product Type</span>
              <div class="text-lg font-semibold">{product?.type || 'N/A'}</div>
            </div>
            <div>
              <span class="text-sm font-medium opacity-70">3PL Customer Product</span>
              <div class="text-lg font-semibold">
                <span
                  class="badge {product?.is_3pl_customer_product
                    ? 'badge-success'
                    : 'badge-neutral'}"
                >
                  {product?.is_3pl_customer_product ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pricing & Costs Section -->
    <div class="rounded-xl bg-base-100 shadow-lg">
      <button
        class="flex w-full items-center justify-between p-6 lg:cursor-default"
        onclick={() => toggleSection('pricing')}
      >
        <div class="flex items-center">
          <div class="bg-secondary mr-3 flex h-10 w-10 items-center justify-center rounded-lg">
            <svg
              class="h-6 w-6 text-secondary-content"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              ></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold">Pricing & Costs</h3>
        </div>
        <svg
          class="h-5 w-5 transform transition-transform lg:hidden {expandedSections.pricing
            ? 'rotate-180'
            : ''}"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </button>

      <div class="px-6 pb-6 {expandedSections.pricing || 'hidden lg:block'}">
        <div class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="rounded-lg bg-green-900 p-4">
              <span class="text-sm font-medium text-green-700 dark:text-green-300"
                >Retail Price</span
              >
              <div class="text-2xl font-bold text-green-800 dark:text-green-200">
                {formatDollarValue(product?.price)}
              </div>
            </div>
            <div class="rounded-lg bg-blue-900 p-4">
              <span class="text-sm font-medium text-blue-700 dark:text-blue-300">B2B Price</span>
              <div class="text-2xl font-bold text-blue-800 dark:text-blue-200">
                {formatDollarValue(product?.b2b_price)}
              </div>
            </div>
            <div class="rounded-lg bg-red-900 p-4">
              <span class="text-sm font-medium text-red-700 dark:text-red-300">Cost of Goods</span>
              <div class="text-2xl font-bold text-red-800 dark:text-red-200">
                {formatDollarValue(product?.cost_of_good)}
              </div>
            </div>
            <div class="rounded-lg bg-yellow-900 p-4">
              <span class="text-sm font-medium text-yellow-700 dark:text-yellow-300">FBA Fee</span>
              <div class="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                {formatDollarValue(product?.fba_fee)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Inventory & Quantities Section -->
    <div class="rounded-xl bg-base-100 shadow-lg">
      <button
        class="flex w-full items-center justify-between p-6 lg:cursor-default"
        onclick={() => toggleSection('inventory')}
      >
        <div class="flex items-center">
          <div class="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
            <svg
              class="h-6 w-6 text-accent-content"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              ></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold">Inventory & Quantities</h3>
        </div>
        <svg
          class="h-5 w-5 transform transition-transform lg:hidden {expandedSections.inventory
            ? 'rotate-180'
            : ''}"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </button>

      <div class="px-6 pb-6 {expandedSections.inventory || 'hidden lg:block'}">
        <div class="space-y-4">
          <div class="grid gap-4 md:grid-cols-3">
            <div class="text-center">
              <div class="rounded-lg bg-base-200 p-4">
                <div class="text-primary text-3xl font-bold">{product?.quantity || 0}</div>
                <div class="text-sm opacity-70">Current Quantity</div>
                <div class="mt-2">
                  <span class="badge {getStatusBadgeClass(product?.quantity)}">
                    {getQuantityStatus(product?.quantity)}
                  </span>
                </div>
              </div>
            </div>

            <div class="text-center">
              <div class="rounded-lg bg-base-200 p-4">
                <div class="text-3xl font-bold text-warning">{product?.pending_quantity || 0}</div>
                <div class="text-sm opacity-70">Pending Quantity</div>
              </div>
            </div>

            <div class="text-center">
              <div class="rounded-lg bg-base-200 p-4">
                <div class="text-3xl font-bold text-info">
                  {product?.projected_po_quantity || 0}
                </div>
                <div class="text-sm opacity-70">Projected PO Quantity</div>
              </div>
            </div>
          </div>

          <!-- Inventory Summary -->
          <div class="mt-6 rounded-lg bg-base-200 p-4">
            <h4 class="mb-3 font-semibold">Inventory Summary</h4>
            <div class="grid gap-2 text-sm">
              <div class="flex justify-between">
                <span>Total Expected:</span>
                <span class="font-semibold"
                  >{(product?.quantity || 0) + (product?.pending_quantity || 0)}</span
                >
              </div>
              <div class="flex justify-between">
                <span>Current Inventory Value:</span>
                <span class="font-semibold">{formatDollarValue(totalInventoryValue)}</span>
              </div>
              <div class="flex justify-between">
                <span>Lot Number:</span>
                <span class="font-semibold">{product?.lot_number || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Details Section -->
    <div class="rounded-xl bg-base-100 shadow-lg">
      <button
        class="flex w-full items-center justify-between p-6 lg:cursor-default"
        onclick={() => toggleSection('details')}
      >
        <div class="flex items-center">
          <div class="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-info">
            <svg
              class="h-6 w-6 text-info-content"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold">Product Details</h3>
        </div>
        <svg
          class="h-5 w-5 transform transition-transform lg:hidden {expandedSections.details
            ? 'rotate-180'
            : ''}"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </button>

      <div class="px-6 pb-6 {expandedSections.details || 'hidden lg:block'}">
        <div class="space-y-6">
          <!-- Package Dimensions -->
          <div>
            <h4 class="mb-3 font-semibold">Package Dimensions</h4>
            <div class="grid gap-4 md:grid-cols-4">
              <div>
                <span class="text-sm font-medium opacity-70">Length</span>
                <div class="text-lg font-semibold">{product?.package_length || 'N/A'}</div>
              </div>
              <div>
                <span class="text-sm font-medium opacity-70">Width</span>
                <div class="text-lg font-semibold">{product?.package_width || 'N/A'}</div>
              </div>
              <div>
                <span class="text-sm font-medium opacity-70">Height</span>
                <div class="text-lg font-semibold">{product?.package_height || 'N/A'}</div>
              </div>
              <div>
                <span class="text-sm font-medium opacity-70">Weight</span>
                <div class="text-lg font-semibold">{product?.package_weight || 'N/A'}</div>
              </div>
            </div>
          </div>

          <!-- Additional Details -->
          <div>
            <h4 class="mb-3 font-semibold">Additional Information</h4>
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <span class="text-sm font-medium opacity-70">Case Pack</span>
                <div class="text-lg font-semibold">{product?.case_pack || 'N/A'}</div>
              </div>
              <div>
                <span class="text-sm font-medium opacity-70">Expiration Date</span>
                <div class="text-lg font-semibold">
                  {product?.expiration_date ? formatReadableDate(product.expiration_date) : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <!-- Description -->
          {#if product?.description}
            <div>
              <h4 class="mb-3 font-semibold">Description</h4>
              <div class="rounded-lg bg-base-200 p-4 text-sm leading-relaxed">
                {product.description}
              </div>
            </div>
          {/if}

          <!-- Notes -->
          {#if product?.notes}
            <div>
              <h4 class="mb-3 font-semibold">Notes</h4>
              <div class="rounded-lg bg-base-200 p-4 text-sm leading-relaxed">
                {product.notes}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- SEO & Metadata Section -->
    <div class="rounded-xl bg-base-100 shadow-lg lg:col-span-2">
      <button
        class="flex w-full items-center justify-between p-6 lg:cursor-default"
        onclick={() => toggleSection('metadata')}
      >
        <div class="flex items-center">
          <div class="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral">
            <svg
              class="h-6 w-6 text-neutral-content"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold">SEO & Metadata</h3>
        </div>
        <svg
          class="h-5 w-5 transform transition-transform lg:hidden {expandedSections.metadata
            ? 'rotate-180'
            : ''}"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </button>

      <div class="px-6 pb-6 {expandedSections.metadata || 'hidden lg:block'}">
        <div class="space-y-4">
          <div class="grid gap-6 lg:grid-cols-2">
            <div>
              <span class="text-sm font-medium opacity-70">SEO Title</span>
              <div class="mt-1 rounded-lg bg-base-200 p-3 text-sm">
                {product?.seo_title || 'Not set'}
              </div>
            </div>
            <div>
              <span class="text-sm font-medium opacity-70">Title</span>
              <div class="mt-1 rounded-lg bg-base-200 p-3 text-sm">
                {product?.title || 'Not set'}
              </div>
            </div>
          </div>

          <div>
            <span class="text-sm font-medium opacity-70">SEO Description</span>
            <div class="mt-1 rounded-lg bg-base-200 p-3 text-sm leading-relaxed">
              {product?.seo_description || 'Not set'}
            </div>
          </div>

          <div class="rounded-lg bg-base-200 p-4">
            <h4 class="mb-3 font-semibold">System Information</h4>
            <div class="grid gap-2 text-sm">
              <div class="flex justify-between">
                <span>Product ID:</span>
                <span class="font-mono font-semibold">{product?.id}</span>
              </div>
              <div class="flex justify-between">
                <span>Created:</span>
                <span class="font-semibold">
                  {product?.created_at ? formatReadableDate(product.created_at) : 'N/A'}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Brand ID:</span>
                <span class="font-mono font-semibold">{product?.brand_id || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
