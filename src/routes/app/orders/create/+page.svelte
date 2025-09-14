<script>
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import {
    products,
    loadProducts,
    currentPage,
    pageSize,
    totalProductCount,
    searchQuery,
  } from '$lib/stores/products.js'
  import { users, loadUsers } from '$lib/stores/users.js'
  import { loadOrders } from '$lib/stores/orders.js'
  import AddressAutocomplete from '$lib/components/AddressAutocomplete.svelte'

  // Import utility functions
  import {
    generateUniqueShippingNumber,
    findBrandNameByBrandId,
    fiftyStates,
    orderTypes,
    calculateTotalPaid,
  } from '$lib/utils'

  let { data } = $props()

  // Get brandId from session
  let brandId = $derived(data?.session?.user?.email)
  let brandName = $derived(findBrandNameByBrandId($users, brandId))

  let orderLineItems = $state(/** @type {any[]} */ ([]))

  // Order fields
  let orderNumber = $state(generateUniqueShippingNumber())
  let orderSource = $state('3PL Client Portal')
  let orderDate = $state(new Date().toISOString().split('T')[0])
  let customerEmail = $state('')
  let customerName = $state('')
  let recipientCompany = $state('')
  let fulfillmentChannel = $state('Hometown')
  let street1 = $state('')
  let city = $state('')
  let orderState = $state('')
  let postalCode = $state('')
  let country = $state('')
  let carrier = $state(null)
  let trackingNumber = $state(null)
  let status = $state('Pending')
  let costOfShipment = $state(0)
  let referralFee = $state(0)
  let totalPaid = $derived(
    orderLineItems.reduce((acc, item) => {
      const unitPrice = item?.unit_price || 0
      const quantity = item?.quantity || 0
      return acc + Number(unitPrice) * Number(quantity)
    }, 0),
  )
  let totalUnitQuantity = $derived(
    orderLineItems.reduce(
      /** @param {number} acc @param {any} item */ (acc, item) => acc + (item.quantity || 0),
      0,
    ),
  )
  let totalCostOfGoods = $state(0)
  let notes = $state('')
  let is3plOrder = $state(true)
  let orderType = $state('customer_order')

  let countryType = $state('Domestic')

  // File upload related state
  let fileInput = $state(/** @type {HTMLInputElement | null} */ (null))
  let isProcessingFile = $state(false)

  // Check if current orderType requires auto-populated fields
  let isSpecialFulfillmentType = $derived(
    orderType === 'amazon_fba' ||
      orderType === 'walmart_fulfillment_services' ||
      orderType === 'chewy',
  )

  // Keep track of previous orderType to detect changes
  let previousOrderType = $state('customer_order')

  // Auto-populate fields when special fulfillment types are selected
  $effect(() => {
    if (isSpecialFulfillmentType) {
      customerEmail = 'storageandfulfillment@hometown-industries.com'
      customerName = orderType
      street1 = '2821 W P Circle'
      city = 'Lincoln'
      orderState = 'NE'
      postalCode = '68528'
      country = 'US' // Set to US for domestic
      countryType = 'Domestic' // Force domestic for these types
    }
  })

  // Clear fields when switching from special fulfillment to regular order types
  $effect(() => {
    // Check if we switched from a special fulfillment type to a regular type
    const wasSpecialFulfillmentType =
      previousOrderType === 'amazon_fba' ||
      previousOrderType === 'walmart_fulfillment_services' ||
      previousOrderType === 'chewy'

    if (wasSpecialFulfillmentType && !isSpecialFulfillmentType) {
      // Clear the auto-populated fields
      customerEmail = ''
      customerName = ''
      street1 = ''
      city = ''
      orderState = ''
      postalCode = ''
      country = ''
      recipientCompany = ''
      countryType = 'Domestic'
    }

    // Update previous orderType for next comparison
    previousOrderType = orderType
  })

  const orderPayload = $derived({
    brand_id: brandId,
    brand_name: brandName,
    order_number: orderNumber,
    order_source: orderSource,
    order_date: orderDate,
    customer_email: customerEmail,
    customer_name: customerName,
    recipient_company: recipientCompany,
    fulfillment_channel: fulfillmentChannel,
    street1,
    city,
    state: orderState,
    postal_code: postalCode,
    country,
    carrier,
    tracking_number: trackingNumber,
    status: 'Pending',
    cost_of_shipment: costOfShipment,
    referral_fee: referralFee,
    total_paid: totalPaid,
    total_unit_quantity: totalUnitQuantity,
    total_cost_of_goods: totalCostOfGoods,
    notes,
    is_3pl_order: is3plOrder,
    order_type: orderType,
    order_line_items: orderLineItems,
  })

  /**
   * @param {any} lineItem
   */
  function removeOrderLineItem(lineItem) {
    const index = orderLineItems.findIndex(
      /** @param {any} item */ (item) => item.sku === lineItem.sku,
    )
    if (index !== -1) {
      orderLineItems.splice(index, 1)
    }
    orderLineItems = [...orderLineItems]
  }

  /**
   * @param {any} product
   */
  function addOrderLineItem(product) {
    const lineItem = {
      order_id: null,
      sku: product?.sku,
      asin: product?.asin,
      product_name: product?.name,
      image_url: product?.image_url,
      product_id: product?.id,
      lot_number: product?.lot_number,
      expiration_date: product?.expiration_date,
      quantity: 1,
      unit_price: product?.price || 0,
      cost_of_good: product?.cost_of_good,
      brand_id: brandId,
      brand_name: brandName,
    }
    const index = orderLineItems.findIndex(
      /** @param {any} item */ (item) => item.sku === lineItem.sku,
    )
    if (index !== -1) {
      alert(
        "You've already added this product to your shipment. The same product cannot be added more than once to the same shipment.",
      )
      return
    }
    orderLineItems = [...orderLineItems, lineItem]
  }

  /**
   * Parse EDI 940 file content and extract line items and address information
   * @param {string} ediContent
   */
  function parseEDI940(ediContent) {
    const lines = ediContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line)
    /** @type {any[]} */
    const lineItems = []
    /** @type {any} */
    const addressInfo = {
      orderNumber: '',
      customerName: '',
      street1: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      notes: '',
    }

    /** @type {any} */
    let currentLineItem = null
    let parsingShipTo = false

    for (const line of lines) {
      // Extract order number
      if (line.startsWith('W05*')) {
        const parts = line.split('*')
        if (parts.length >= 3) {
          addressInfo.orderNumber = parts[2] || ''
        }
      }

      // Ship To information
      if (line.startsWith('N1*ST*')) {
        parsingShipTo = true
        const parts = line.split('*')
        if (parts.length >= 3) {
          addressInfo.customerName = parts[2] || ''
        }
      }

      // Address line (only capture if we're parsing ship-to)
      if (line.startsWith('N3*') && parsingShipTo) {
        addressInfo.street1 = line.substring(3) || '' // Remove 'N3*' prefix
      }

      // City, State, Postal Code (only capture if we're parsing ship-to)
      if (line.startsWith('N4*') && parsingShipTo) {
        const parts = line.split('*')
        if (parts.length >= 4) {
          addressInfo.city = parts[1] || ''
          addressInfo.state = parts[2] || ''
          addressInfo.postalCode = parts[3] || ''
          // Determine country based on state/province format
          if (parts[2] && parts[2].length === 2 && /^[A-Z]{2}$/.test(parts[2])) {
            // Could be US state or Canadian province
            if (fiftyStates.includes(parts[2])) {
              addressInfo.country = 'US'
            } else {
              // Assume Canada for other 2-letter codes
              addressInfo.country = 'CA'
            }
          }
        }
        parsingShipTo = false // Reset after parsing address
      }

      // Special instructions/notes
      if (line.startsWith('NTE*')) {
        const parts = line.split('*')
        if (parts.length >= 3) {
          addressInfo.notes = parts[2] || ''
        }
      }

      // Start of a new line item
      if (line.startsWith('LX*')) {
        if (currentLineItem) {
          lineItems.push(currentLineItem)
        }
        currentLineItem = {
          quantity: 0,
          unit: '',
          upc: '',
          sku: '',
          product_name: '',
        }
      }

      // Product details line
      if (line.startsWith('W01*') && currentLineItem) {
        const parts = line.split('*')
        if (parts.length >= 6) {
          currentLineItem.quantity = parseFloat(parts[1]) || 0
          currentLineItem.unit = parts[2] || 'EA'
          currentLineItem.upc = parts[3] || ''
          currentLineItem.sku = parts[5] || ''
        }
      }

      // Product description line
      if (line.startsWith('G69*') && currentLineItem) {
        currentLineItem.product_name = line.substring(4).trim() || 'Unknown Product' // Remove 'G69*' prefix and trim whitespace
      }
    }

    // Don't forget the last item
    if (currentLineItem) {
      lineItems.push(currentLineItem)
    }

    // Filter out invalid line items (missing required fields)
    const validLineItems = lineItems.filter(
      /** @param {any} item */ (item) =>
        item.sku &&
        item.sku.trim() !== '' &&
        item.quantity > 0 &&
        item.product_name &&
        item.product_name.trim() !== '',
    )

    return { lineItems: validLineItems, addressInfo }
  }

  /**
   * Handle EDI file upload
   * @param {Event} event
   */
  async function handleEDIFileUpload(event) {
    /** @type {HTMLInputElement} */
    const input = /** @type {HTMLInputElement} */ (event.target)
    if (!input || !input.files || input.files.length === 0) {
      return
    }

    const file = input.files[0]

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.txt') && !file.name.toLowerCase().endsWith('.edi')) {
      alert('Please select a valid EDI file (.txt or .edi)')
      return
    }

    isProcessingFile = true

    try {
      const fileContent = await file.text()
      const parseResult = parseEDI940(fileContent)
      const { lineItems: parsedLineItems, addressInfo } = parseResult

      if (parsedLineItems.length === 0) {
        alert('No valid line items found in the EDI file. Please check the file format.')
        return
      }

      // Auto-populate address fields from EDI file
      if (addressInfo.customerName) customerName = addressInfo.customerName
      if (addressInfo.customerName && !customerEmail.trim()) {
        // Only set placeholder email if current email is empty
        customerEmail = 'placeholder@example.com' // User will need to update this
      }
      if (addressInfo.street1) street1 = addressInfo.street1
      if (addressInfo.city) city = addressInfo.city
      if (addressInfo.state) orderState = addressInfo.state
      if (addressInfo.postalCode) postalCode = addressInfo.postalCode
      if (addressInfo.notes) notes = addressInfo.notes
      if (addressInfo.orderNumber) orderNumber = addressInfo.orderNumber

      // Set country and countryType based on parsed country
      if (addressInfo.country) {
        country = addressInfo.country
        countryType = addressInfo.country === 'US' ? 'Domestic' : 'International'
      }

      // Set order type to b2b_order for EDI uploads
      orderType = 'b2b_order'

      // Convert parsed items to our orderLineItems format
      const newOrderLineItems = parsedLineItems.map((item) => {
        // Try to find matching product in our products list for additional details
        const matchingProduct = $products.find((p) => p.sku === item.sku)

        return {
          order_id: null,
          sku: item.sku,
          asin: matchingProduct?.asin || null,
          product_name: item.product_name,
          image_url: matchingProduct?.image_url || null,
          product_id: matchingProduct?.id || null,
          lot_number: matchingProduct?.lot_number || null,
          expiration_date: matchingProduct?.expiration_date || null,
          quantity: item.quantity,
          unit_price: matchingProduct?.price || 0,
          cost_of_good: matchingProduct?.cost_of_good || 0,
          brand_id: brandId,
          brand_name: brandName,
        }
      })

      // Check for duplicates and merge with existing items
      const existingSkus = new Set(orderLineItems.map((item) => item.sku))
      const duplicateSkus = newOrderLineItems
        .filter((item) => existingSkus.has(item.sku))
        .map((item) => item.sku)

      if (duplicateSkus.length > 0) {
        const proceed = confirm(
          `The following SKUs are already in your order: ${duplicateSkus.join(', ')}.\n\nWould you like to replace the existing quantities with the ones from the EDI file?`,
        )

        if (!proceed) {
          return
        }

        // Remove existing items with duplicate SKUs
        orderLineItems = orderLineItems.filter((item) => !duplicateSkus.includes(item.sku))
      }

      // Add new items
      orderLineItems = [...orderLineItems, ...newOrderLineItems]

      // Create a detailed summary of what was imported
      const importSummary = newOrderLineItems
        .map((item) => `• ${item.sku}: ${item.quantity} x ${item.product_name}`)
        .join('\n')
      const matchedProducts = newOrderLineItems.filter((item) => item.product_id).length
      const unmatchedProducts = newOrderLineItems.length - matchedProducts

      let summaryMessage = `Successfully imported ${newOrderLineItems.length} line items from EDI file.\n\n`
      summaryMessage += `Address auto-populated: ${addressInfo.customerName}, ${addressInfo.city}, ${addressInfo.state}\n`
      summaryMessage += `Order type set to: B2B Order\n`
      summaryMessage += `Country type set to: ${countryType}\n\n`
      summaryMessage += `Products matched in inventory: ${matchedProducts}\n`
      if (unmatchedProducts > 0) {
        summaryMessage += `Products not found in inventory: ${unmatchedProducts} (prices set to $0)\n`
      }
      summaryMessage += `\nImported items:\n${importSummary}`

      alert(summaryMessage)

      // Clear the file input
      if (fileInput) {
        fileInput.value = ''
      }
    } catch (error) {
      console.error('Error processing EDI file:', error)
      alert('Error processing the EDI file. Please check the file format and try again.')
    } finally {
      isProcessingFile = false
    }
  }

  /**
   * Trigger file upload dialog
   */
  function triggerFileUpload() {
    fileInput?.click()
  }

  async function createOrder() {
    // Validate the order payload
    if (orderLineItems.length < 1) {
      alert('Please add at least one product to your order.')
      return
    }
    if (orderLineItems.some((item) => item.quantity < 1)) {
      alert('Please add a quantity greater than 0 to your order.')
      return
    }

    // Validate required fields for non-special fulfillment types
    if (!isSpecialFulfillmentType) {
      const requiredFields = []

      if (!customerName?.trim()) requiredFields.push('Customer Name')
      if (!customerEmail?.trim()) requiredFields.push('Customer Email')
      if (!street1?.trim()) requiredFields.push('Street Address')
      if (!city?.trim()) requiredFields.push('City')
      if (!postalCode?.trim())
        requiredFields.push(countryType === 'Domestic' ? 'ZIP Code' : 'Postal Code')
      if (!orderState?.trim())
        requiredFields.push(countryType === 'Domestic' ? 'State' : 'State/Province')

      if (requiredFields.length > 0) {
        alert(`Please fill out the following required fields:\n\n• ${requiredFields.join('\n• ')}`)
        return
      }
    }

    try {
      // Single unified API call that handles both database and ShipStation
      const response = await fetch('/app/api/orders/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderPayload }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Show ShipStation warning if it failed
        if (!result.shipStation.success) {
          console.warn('ShipStation creation failed:', result.shipStation.error)
          alert(
            'Order created in database, but ShipStation sync failed. This will be retried later.',
          )
        }
        // Reload orders and reset form
        if (brandId) {
          loadOrders(data.supabase, brandId)
        }
        orderLineItems = []
        goto(`/app/orders`)
      } else {
        // Order creation failed
        console.error('Order creation failed:', result)
        alert(`Failed to create order: ${result.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Network error:', error)
      alert('Failed to create order due to network error. Please try again.')
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
      if (brandId) {
        await loadProducts(data.supabase, brandId)
      }
    }
  }

  /**
   * Handle the search button click
   */
  async function handleSearch() {
    $currentPage = 1 // Reset to first page when searching
    if (brandId) {
      await loadProducts(data.supabase, brandId)
    }
  }

  /**
   * @param {number} page
   */
  async function goToPage(page) {
    $currentPage = page
    if (brandId) {
      await loadProducts(data.supabase, brandId)
    }
  }

  /**
   * @param {number} size
   */
  async function changePageSize(size) {
    $pageSize = size
    $currentPage = 1 // Reset to first page on page size change
    if (brandId) {
      await loadProducts(data.supabase, brandId)
    }
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

  /**
   * Handle address selection from autocomplete
   * @param {CustomEvent} event
   */
  function handleAddressSelected(event) {
    const {
      street1: selectedStreet1,
      city: selectedCity,
      state: selectedState,
      postalCode: selectedPostalCode,
    } = event.detail

    // Update form fields with selected address
    street1 = selectedStreet1
    city = selectedCity
    orderState = selectedState
    postalCode = selectedPostalCode
  }

  // Execute onMount
  onMount(async () => {
    if (brandId) {
      await loadProducts(data.supabase, brandId)
      await loadUsers(data.supabase)
    }
  })
</script>

<!-- Back button at the top left -->
<div class="ml-10 mt-4">
  <button onclick={() => goto('/app/orders')} class="btn btn-outline btn-sm">
    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M10 19l-7-7m0 0l7-7m-7 7h18"
      ></path>
    </svg>
    <span>Back to Orders</span>
  </button>
</div>

<!-- CREATE Order SECTION BEGINS -->
<div class="mt-10 flex justify-center">
  <div class="bg-base-100 mx-4 w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl md:mx-10">
    <div class="from-primary to-secondary bg-gradient-to-r px-6 pb-3 pt-6 text-center">
      <h1 class="text-primary text-2xl font-bold md:text-4xl">Create New Order</h1>
      <!-- <p class="text-primary mt-2">
        Build your order by selecting products and filling out the details
      </p> -->
    </div>
    <div class="px-6 pb-6 pt-3">
      {#if orderLineItems.length > 0}
        <div class="bg-base-100 mb-6 overflow-hidden rounded-xl shadow-lg">
          <div class="bg-primary p-4 text-center">
            <h3 class="text-primary text-2xl font-bold md:text-xl">Selected Products</h3>
            <p class="text-primary mt-2 text-sm">
              Review and adjust quantities before creating your order
            </p>
          </div>
          <div class="overflow-x-auto p-4">
            <table class="table w-full border-2">
              <thead>
                <tr class="border-2">
                  <th class="text-left">Product Image</th>
                  <th class="text-left">Product Name</th>
                  <th class="text-left">SKU</th>

                  <th class="text-center">Quantity</th>
                  <th class="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {#each orderLineItems as lineItem}
                  <tr class="hover:bg-base-50 border-base-200 border-b transition-colors">
                    <td>
                      <div class="flex items-center">
                        <img
                          class="ring-base-300 h-16 w-16 rounded-lg object-cover shadow-md ring-2"
                          alt="Product"
                          src={lineItem.image_url === null
                            ? '/placeholder-image.jpg'
                            : lineItem.image_url}
                        />
                      </div>
                    </td>
                    <td class="max-w-xs">
                      <div class="truncate font-medium" title={lineItem.product_name}>
                        {lineItem.product_name}
                      </div>
                    </td>
                    <td class="font-medium">{lineItem.sku}</td>

                    <td class="text-center">
                      <input
                        class="focus:border-primary focus:ring-primary/20 input input-sm input-bordered md:input-md w-20 text-center focus:outline-none focus:ring-2 md:w-24"
                        bind:value={lineItem.quantity}
                        type="number"
                        min="1"
                      />
                    </td>
                    <td class="text-center">
                      <button
                        onclick={() => removeOrderLineItem(lineItem)}
                        class="btn btn-error btn-sm flex items-center gap-1 shadow-md transition-all duration-200 hover:scale-105"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Order FIELDS BEGINS -->
        <form
          class="from-base-200 to-base-300 space-y-6 rounded-xl bg-gradient-to-br p-6 shadow-lg md:p-8"
        >
          <div class="text-center">
            <h2 class="text-base-content text-xl font-bold md:text-2xl">📦 Order Details</h2>
            <p class="text-base-content/70 mt-1 text-sm">
              Fill out the information below to create your order
            </p>
          </div>

          <!-- DOMESTIC INTERNATIONAL SHIPMENT TOGGLE BEGINS -->
          {#if !isSpecialFulfillmentType}
            <div class="flex justify-center">
              <div class="bg-base-100 rounded-lg p-1 shadow-inner">
                <button
                  onclick={() => (countryType = 'Domestic')}
                  class:btn-primary={countryType === 'Domestic'}
                  class:btn-ghost={countryType !== 'Domestic'}
                  class="btn btn-sm md:btn-md">🇺🇸 Domestic</button
                >
                <button
                  onclick={() => (countryType = 'International')}
                  class:btn-primary={countryType === 'International'}
                  class:btn-ghost={countryType !== 'International'}
                  class="btn btn-sm md:btn-md">🌍 International</button
                >
              </div>
            </div>
          {/if}
          <!-- DOMESTIC INTERNATIONAL SHIPMENT TOGGLE ENDS -->

          <!-- Order Type Badge -->
          <div class="flex justify-center">
            <div
              class="badge badge-secondary badge-lg text-secondary-content px-4 py-2 font-semibold"
            >
              📋 Order Type: {orderTypes.find((type) => type.value === orderType)?.label ||
                'Customer Order'}
            </div>
          </div>

          <!-- ORDER TYPE SELECTION BEGINS -->
          <div class="bg-base-100 rounded-lg p-4 shadow-sm">
            <label class="label pb-2" for="orderType">
              <span class="label-text font-semibold">📋 Order Type</span>
            </label>
            <select
              class="focus:border-primary focus:ring-primary/20 select select-bordered w-full focus:outline-none focus:ring-2"
              bind:value={orderType}
            >
              {#each orderTypes as type}
                <option value={type.value}>{type.label}</option>
              {/each}
            </select>
          </div>
          <!-- ORDER TYPE SELECTION ENDS -->

          <!-- SPECIAL FULFILLMENT TYPE NOTICE -->
          {#if isSpecialFulfillmentType}
            <!-- <div class="rounded-lg border border-info/20 bg-info/10 p-4">
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-info" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fill-rule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-info">Special Fulfillment Order</h3>
                  <div class="mt-2 text-sm text-info/80">
                    <p>
                      Customer information and shipping address have been automatically populated
                      with default values. Your team will manually reach out for complete details as
                      needed.
                    </p>
                  </div>
                </div>
              </div>
            </div> -->
          {/if}

          <!-- CUSTOMER INFORMATION SECTION -->
          {#if !isSpecialFulfillmentType}
            <div class="bg-base-100 rounded-lg p-4 shadow-sm">
              <h3 class="text-base-content mb-4 flex items-center text-lg font-semibold">
                <span class="mr-2">👤</span>Customer Information
              </h3>
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label class="label pb-1" for="customerName">
                    <span class="label-text font-medium">Customer Name</span>
                    <span class="label-text-alt text-error">*</span>
                  </label>
                  <input
                    bind:value={customerName}
                    required
                    class="focus:border-primary focus:ring-primary/20 input input-bordered w-full focus:outline-none focus:ring-2"
                    type="text"
                    placeholder="Enter customer's full name"
                  />
                </div>
                <div>
                  <label class="label pb-1" for="customerEmail">
                    <span class="label-text font-medium">Customer Email</span>
                    <span class="label-text-alt text-error">*</span>
                  </label>
                  <input
                    bind:value={customerEmail}
                    required
                    class="focus:border-primary focus:ring-primary/20 input input-bordered w-full focus:outline-none focus:ring-2"
                    type="email"
                    placeholder="customer@example.com"
                  />
                </div>
                <div class="md:col-span-2">
                  <label class="label pb-1" for="recipientCompany">
                    <span class="label-text font-medium">Company Name</span>
                  </label>
                  <input
                    bind:value={recipientCompany}
                    class="focus:border-primary focus:ring-primary/20 input input-bordered w-full focus:outline-none focus:ring-2"
                    type="text"
                    placeholder="Company name (optional)"
                  />
                </div>
              </div>
            </div>
          {/if}

          <!-- SHIPPING ADDRESS SECTION -->
          {#if !isSpecialFulfillmentType}
            <div class="bg-base-100 rounded-lg p-4 shadow-sm">
              <h3 class="text-base-content mb-4 flex items-center text-lg font-semibold">
                <span class="mr-2">📍</span>Shipping Address
              </h3>
              <div class="space-y-4">
                {#if countryType === 'International'}
                  <div class="grid grid-cols-1 gap-2 md:gap-4">
                    <div>
                      <label class="label label-text py-1 md:py-2" for="country">Country</label>
                      <select
                        class="select select-bordered select-sm md:select-md w-full"
                        bind:value={country}
                      >
                        <option value="" disabled>Select Country</option>
                        <option value="CA">Canada</option>
                        <option value="GB">United Kingdom</option>
                        <option value="AU">Australia</option>
                        <option value="EST">Estonia</option>
                        <option value="FR">France</option>
                        <option value="DE">Germany</option>
                        <option value="DK">Denmark</option>
                        <!-- Add more countries as needed -->
                      </select>
                    </div>
                  </div>
                {/if}
                <div>
                  <label class="label pb-1" for="street1">
                    <span class="label-text font-medium">Street Address</span>
                    <span class="label-text-alt text-error">*</span>
                  </label>
                  {#if countryType === 'Domestic'}
                    <AddressAutocomplete
                      bind:value={street1}
                      placeholder="Start typing an address..."
                      inputClass="focus:border-primary focus:ring-primary/20 input input-bordered w-full focus:outline-none focus:ring-2"
                      on:addressSelected={handleAddressSelected}
                    />
                    <div class="label">
                      <span class="label-text-alt text-base-content/60">
                        🏠 Address suggestions powered by SmartyStreets
                      </span>
                    </div>
                  {:else}
                    <input
                      bind:value={street1}
                      required
                      class="focus:border-primary focus:ring-primary/20 input input-bordered w-full focus:outline-none focus:ring-2"
                      type="text"
                      placeholder="123 Main Street, Apt 4B"
                    />
                  {/if}
                </div>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label class="label pb-1" for="city">
                      <span class="label-text font-medium">City</span>
                      <span class="label-text-alt text-error">*</span>
                    </label>
                    <input
                      bind:value={city}
                      required
                      class="focus:border-primary focus:ring-primary/20 input input-bordered w-full focus:outline-none focus:ring-2"
                      type="text"
                      placeholder="City name"
                    />
                  </div>
                  <div>
                    <label class="label pb-1" for="postalCode">
                      <span class="label-text font-medium"
                        >{countryType === 'Domestic' ? 'ZIP Code' : 'Postal Code'}</span
                      >
                      <span class="label-text-alt text-error">*</span>
                    </label>
                    <input
                      bind:value={postalCode}
                      required
                      class="focus:border-primary focus:ring-primary/20 input input-bordered w-full focus:outline-none focus:ring-2"
                      type="text"
                      placeholder={countryType === 'Domestic' ? '12345' : 'Postal code'}
                    />
                  </div>
                </div>

                <div>
                  {#if countryType === 'Domestic'}
                    <label class="label pb-1" for="orderState">
                      <span class="label-text font-medium">State</span>
                      <span class="label-text-alt text-error">*</span>
                    </label>
                    <select
                      class="focus:border-primary focus:ring-primary/20 select select-bordered w-full focus:outline-none focus:ring-2"
                      bind:value={orderState}
                    >
                      <option value="" disabled selected>Select a state</option>
                      {#each fiftyStates as state}
                        <option value={state}>{state}</option>
                      {/each}
                    </select>
                  {:else}
                    <label class="label pb-1" for="orderState">
                      <span class="label-text font-medium">State/Province</span>
                      <span class="label-text-alt text-error">*</span>
                    </label>
                    <input
                      bind:value={orderState}
                      required
                      class="focus:border-primary focus:ring-primary/20 input input-bordered w-full focus:outline-none focus:ring-2"
                      type="text"
                      placeholder="State, province, or region"
                    />
                  {/if}
                </div>
              </div>
            </div>
          {/if}

          <!-- ADDITIONAL NOTES SECTION -->
          <div class="bg-base-100 rounded-lg p-4 shadow-sm">
            <label class="label pb-1" for="notes">
              <span class="label-text flex items-center font-medium">
                <span class="mr-2">📝</span>Special Instructions
              </span>
              <span class="label-text-alt">Optional</span>
            </label>
            <textarea
              bind:value={notes}
              class="focus:border-primary focus:ring-primary/20 textarea textarea-bordered w-full focus:outline-none focus:ring-2"
              placeholder="Any special handling instructions, delivery notes, or other important details..."
              rows="3"
            ></textarea>
          </div>
        </form>
        <!-- Order FIELDS ENDS -->

        <div class="mt-6 flex justify-center">
          <button
            onclick={createOrder}
            class="btn btn-primary btn-lg shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
          >
            <span class="mr-2">🚀</span>
            Create Order
          </button>
        </div>
      {:else}
        <div class="bg-base-100 rounded-xl p-8 text-center">
          <div class="bg-base-100 mx-auto mb-4 h-24 w-24 rounded-full p-6 shadow-lg">
            <span class="text-4xl">📦</span>
          </div>
          <h3 class="text-base-content mb-2 text-xl font-bold">No Products Selected</h3>
          <p class="text-base-content/70 mb-4">
            Start building your order by selecting products from the product list below.
          </p>
          <div class="bg-info/10 rounded-lg p-4">
            <p class="text-primary text-sm">
              💡 <strong>Tip:</strong> Use the search bar to quickly find specific products by name,
              SKU, or ASIN
            </p>
          </div>
          {#if brandId === 'kthemelis@jascor-intl.com'}
            <div class="mt-4 flex flex-col items-center gap-3">
              <!-- Hidden file input -->
              <input
                type="file"
                accept=".txt,.edi"
                bind:this={fileInput}
                onchange={handleEDIFileUpload}
                class="hidden"
              />

              <!-- Upload button -->
              <button
                onclick={triggerFileUpload}
                disabled={isProcessingFile}
                class="btn btn-primary"
                class:loading={isProcessingFile}
              >
                {#if isProcessingFile}
                  <span class="loading loading-spinner loading-sm"></span>
                  Processing EDI File...
                {:else}
                  <span class="mr-2">📄</span>
                  Upload EDI 940 File
                {/if}
              </button>

              <p class="text-base-content/60 max-w-sm text-center text-xs">
                Upload a .txt or .edi file containing EDI 940 warehouse shipping order data to
                automatically populate your order line items
              </p>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
<!-- CREATE Order SECTION ENDS -->

<!-- PRODUCT SECTION BEGINS -->
<div class="mt-10 flex justify-center">
  <div class="bg-base-100 ml-10 mr-10 w-full max-w-full overflow-hidden rounded-lg p-4 shadow-xl">
    <h1 class="mb-5 text-center text-2xl font-bold">Products</h1>

    <!-- Button and pagination controls in separate, centered div -->
    <div class="mb-4 flex flex-col items-center gap-4">
      <!-- Search bar -->
      <div class="flex w-full max-w-sm items-center">
        <input
          type="text"
          placeholder="Search by name, SKU or ASIN..."
          class="input input-bordered bg-base-200 w-full"
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

    <!-- This div makes the table horizontally scrollable -->
    <div class="w-full overflow-x-auto">
      <table class="table-zebra table min-w-[1000px]">
        <thead>
          <tr>
            <th>Product Image</th>
            <th>Name</th>
            <th>Sku</th>
            <!-- <th>Asin</th> -->
            <th>Quantity</th>
            <th>Add To Shipment</th>
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
              <td>{product?.sku}</td>
              <td>{product?.quantity}</td>
              <!-- <td>
                {#if product?.asin === null}{:else}
                  <a
                    href={`https://www.amazon.com/dp/${product?.asin}`}
                    target="_blank"
                    class="link-primary font-semibold underline">{product?.asin}</a
                  >
                {/if}
              </td> -->
              <td>
                <button onclick={() => addOrderLineItem(product)} class="btn btn-outline"
                  >Select</button
                >
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
<!-- PRODUCT SECTION ENDS -->
