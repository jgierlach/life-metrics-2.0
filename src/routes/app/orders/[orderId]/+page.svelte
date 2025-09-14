<script>
  import { formatDollarValue, formatReadableDate, calculate3plFeesForOrder } from '$lib/utils'
  import { goto } from '$app/navigation'

  /** @type {import('./$types').PageData} */
  let { data } = $props()
  let { order, orderLineItems, billingInfo, session } = data

  // Calculate 3PL fees based on billing info
  let threePlFees = $derived(calculate3plFeesForOrder(billingInfo, order))

  let totalCostOfShipment = $derived((order?.cost_of_shipment || 0) + threePlFees)

  let totalRevenue = $derived(
    (order?.total_paid || 0) + (order?.what_customer_paid_for_shipping || 0),
  )

  let estimatedGrossProfit = $derived(
    totalRevenue -
      (order?.total_cost_of_goods || 0) -
      (totalCostOfShipment || 0) -
      (order?.referral_fee || 0),
  )

  let returnOnInvestment = $derived(
    (order?.total_cost_of_goods || 0) > 0
      ? (estimatedGrossProfit / (order?.total_cost_of_goods || 0)) * 100
      : 0,
  )

  let totalCosts = $derived(
    (order?.total_cost_of_goods || 0) + (totalCostOfShipment || 0) + (order?.referral_fee || 0),
  )

  // Mobile collapsible state
  let expandedCards = $state({
    customer: false,
    revenue: false,
    costs: false,
    status: false,
  })

  // Copy functionality
  function copyOrderNumber() {
    if (order?.order_number) {
      navigator.clipboard.writeText(order.order_number.toString())
      // You could add a toast notification here
    }
  }

  /**
   * @param {keyof expandedCards} cardName
   */
  function toggleCard(cardName) {
    expandedCards[cardName] = !expandedCards[cardName]
  }
</script>

<div class="mx-auto max-w-7xl p-4">
  <!-- ORDER OVERVIEW SECTION BEGINS -->
  <div class="mb-8">
    <!-- Header with Back Button, Order Number and Date -->
    <div class="mb-6">
      <!-- Back Button and Order Header Row -->
      <div class="mb-4 flex items-center justify-between">
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
        <div class="flex-1 text-center">
          <div class="flex items-center justify-center gap-3">
            <h1 class="text-primary text-3xl font-bold">Order #{order?.order_number}</h1>
            <button
              onclick={copyOrderNumber}
              class="text-primary hover:bg-primary btn btn-ghost btn-sm hover:text-white"
              title="Copy order number"
              aria-label="Copy order number"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                ></path>
              </svg>
            </button>
          </div>
        </div>
        <!-- Empty div for balance -->
        <div class="w-32"></div>
      </div>
      <!-- Date centered below -->
      <div class="text-center">
        <p class="text-base-content/70 text-lg">{formatReadableDate(order?.order_date)}</p>
      </div>
    </div>

    <!-- Profit Margin Indicator -->
    {#if order?.cost_of_shipment > 0 && order?.order_type === 'customer_order'}
      <div
        class="bg-base-100 mb-6 rounded-xl border-2 border-purple-200 p-6 shadow-lg dark:border-purple-700"
      >
        <!-- Single row layout: Icon + Title → Equation → Final Result -->
        <div
          class="flex flex-col items-center space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-x-6 lg:space-y-0"
        >
          <!-- Left: Icon and Title -->
          <div class="flex items-center">
            <div
              class="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <svg class="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                ></path>
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-purple-600">Estimated Gross Profit</h3>
              <p class="text-purple-500">Revenue minus all costs</p>
            </div>
          </div>

          <!-- Center: Calculation equation -->
          <div class="flex flex-col items-center space-y-5 md:flex-row md:space-x-5 md:space-y-0">
            <!-- Total Revenue -->
            <div
              class="dark:bg-base-100 flex items-center space-x-3 rounded-lg border-2 border-green-200 bg-white px-5 py-4 shadow-sm dark:border-green-700"
            >
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600">
                <svg
                  class="h-5 w-5 text-white"
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
              <div>
                <p class="text-xs font-medium text-green-700 dark:text-green-600">Total Revenue</p>
                <p class="text-lg font-bold text-green-600 dark:text-green-500">
                  {formatDollarValue(totalRevenue)}
                </p>
              </div>
            </div>

            <!-- Minus Symbol -->
            <div
              class="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700"
            >
              <svg
                class="h-7 w-7 text-gray-600 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M18 12H6"
                ></path>
              </svg>
            </div>

            <!-- Total Costs -->
            <div
              class="dark:bg-base-100 flex items-center space-x-3 rounded-lg border-2 border-orange-200 bg-white px-5 py-4 shadow-sm dark:border-orange-700"
            >
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600">
                <svg
                  class="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <div>
                <p class="text-xs font-medium text-orange-700 dark:text-orange-600">Total Costs</p>
                <p class="text-lg font-bold text-orange-600 dark:text-orange-500">
                  {formatDollarValue(totalCosts)}
                </p>
              </div>
            </div>

            <!-- Equals Symbol -->
            <div
              class="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700"
            >
              <svg
                class="h-7 w-7 text-gray-600 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="3"
                  d="M6 10h12M6 14h12"
                ></path>
              </svg>
            </div>

            <!-- Gross Profit Result -->
            <div
              class="dark:bg-base-100 flex items-center space-x-3 rounded-lg border-2 border-purple-200 bg-white px-5 py-4 shadow-sm dark:border-purple-700"
            >
              <div
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-pink-600"
              >
                <svg
                  class="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  ></path>
                </svg>
              </div>
              <div>
                <p class="text-xs font-medium text-purple-700 dark:text-purple-600">
                  Est Gross Profit
                </p>
                <p class="text-lg font-bold text-purple-600 dark:text-purple-500">
                  {formatDollarValue(estimatedGrossProfit)}
                </p>
              </div>
            </div>
          </div>

          <!-- Right: Final result with metrics -->
          <div class="text-center lg:text-right">
            <p class="text-3xl font-bold text-purple-600">
              {formatDollarValue(estimatedGrossProfit)}
            </p>
            <div class="flex flex-col space-y-1">
              <p class="text-sm text-purple-500">
                {((estimatedGrossProfit / (totalRevenue || 1)) * 100).toFixed(1)}% margin
              </p>
              <p class="text-sm text-purple-500">
                {returnOnInvestment.toFixed(1)}% ROI
              </p>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Main Overview Cards -->
    <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
      <!-- Customer & Source Info Card -->
      <div
        class="bg-base-100 rounded-xl border-2 border-blue-200 p-6 shadow-lg dark:border-blue-700"
      >
        <!-- Mobile toggle button -->
        <button
          class="mb-4 flex w-full items-center justify-between lg:hidden"
          onclick={() => toggleCard('customer')}
        >
          <div class="flex items-center">
            <div class="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                ></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-blue-600">Customer Info</h3>
          </div>
          <svg
            class="h-5 w-5 transform transition-transform {expandedCards.customer
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

        <!-- Desktop header -->
        <div class="mb-4 hidden items-center lg:flex">
          <div class="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              ></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-blue-600">Customer Info</h3>
        </div>
        <!-- Collapsible content -->
        <div class="lg:block {expandedCards.customer ? 'block' : 'hidden lg:block'}">
          <div class="space-y-3">
            <div>
              <p class="text-sm font-medium text-blue-600">Customer Name</p>
              <p class="text-lg font-semibold text-blue-500">
                {order?.customer_name || 'N/A'}
              </p>
            </div>
            <div>
              <p class="text-sm font-medium text-blue-600">Shipping Address</p>
              {#if order?.street1}
                <div class="text-sm text-blue-500">
                  <p>{order.street1}</p>
                  <p>
                    {order?.city}{order?.state ? `, ${order.state}` : ''}
                    {order?.postal_code || ''}
                  </p>
                  {#if order?.country}
                    <p>{order.country}</p>
                  {/if}
                </div>
              {:else}
                <p class="text-sm text-blue-500">N/A</p>
              {/if}
            </div>
            <div>
              <p class="text-sm font-medium text-blue-600">Order Source</p>
              <span
                class="inline-block rounded-full bg-blue-500 px-3 py-1 text-sm font-medium text-white"
              >
                {order?.order_source || 'Unknown'}
              </span>
            </div>
            <div>
              <p class="text-sm font-medium text-blue-600">Fulfillment Channel</p>
              <div class="flex items-center space-x-2">
                <span
                  class="inline-block rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1 text-sm font-medium text-white shadow-sm"
                >
                  {order?.fulfillment_channel || 'Not Specified'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Financial Summary Card -->
      {#if order?.order_type === 'customer_order'}
        <div
          class="bg-base-100 rounded-xl border-2 border-green-200 p-6 shadow-lg dark:border-green-700"
        >
          <!-- Mobile toggle button -->
          <button
            class="mb-4 flex w-full items-center justify-between lg:hidden"
            onclick={() => toggleCard('revenue')}
          >
            <div class="flex items-center">
              <div class="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
                <svg
                  class="h-6 w-6 text-white"
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
              <h3 class="text-lg font-semibold text-green-600">
                Revenue • {formatDollarValue(totalRevenue)}
              </h3>
            </div>
            <svg
              class="h-5 w-5 transform transition-transform {expandedCards.revenue
                ? 'rotate-180'
                : ''}"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </button>

          <!-- Desktop header -->
          <div class="mb-4 hidden items-center lg:flex">
            <div class="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
              <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                ></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-green-600">Revenue Overview</h3>
          </div>
          <!-- Collapsible content -->
          <div class="lg:block {expandedCards.revenue ? 'block' : 'hidden lg:block'}">
            <div class="space-y-3">
              <div>
                <p class="text-sm font-medium text-green-600">Total Revenue</p>
                <p class="text-2xl font-bold text-green-500">
                  {formatDollarValue(totalRevenue)}
                </p>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-green-600">Items</span>
                <span class="font-semibold text-green-500"
                  >{formatDollarValue(order?.total_paid)}</span
                >
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-green-600">Shipping Paid by Customer</span>
                <span class="font-semibold text-green-500"
                  >{formatDollarValue(order?.what_customer_paid_for_shipping || 0)}</span
                >
              </div>
              <div
                class="flex items-center justify-between border-t border-gray-200 pt-2 dark:border-green-700"
              >
                <span class="text-sm text-green-600">Total Revenue</span>
                <span class="text-lg font-bold text-green-500"
                  >{formatDollarValue(totalRevenue)}</span
                >
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Cost Breakdown Card -->
      {#if order?.order_type === 'customer_order'}
        <div
          class="bg-base-100 rounded-xl border-2 border-orange-200 p-6 shadow-lg dark:border-orange-700"
        >
          <!-- Mobile toggle button -->
          <button
            class="mb-4 flex w-full items-center justify-between lg:hidden"
            onclick={() => toggleCard('costs')}
          >
            <div class="flex items-center">
              <div class="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600">
                <svg
                  class="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-orange-600">
                Costs • {formatDollarValue(totalCosts)}
              </h3>
            </div>
            <svg
              class="h-5 w-5 transform transition-transform {expandedCards.costs
                ? 'rotate-180'
                : ''}"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </button>

          <!-- Desktop header -->
          <div class="mb-4 hidden items-center lg:flex">
            <div class="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600">
              <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                ></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-orange-600">Cost Breakdown</h3>
          </div>
          <!-- Collapsible content -->
          <div class="lg:block {expandedCards.costs ? 'block' : 'hidden lg:block'}">
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-sm text-orange-600">Cost of Goods</span>
                <span class="font-semibold text-orange-500"
                  >{formatDollarValue(order?.total_cost_of_goods)}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-orange-600">Shipment</span>
                <span class="font-semibold text-orange-500"
                  >{formatDollarValue(totalCostOfShipment)}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-orange-600">Referral Fee</span>
                <span class="font-semibold text-orange-500"
                  >{formatDollarValue(order?.referral_fee)}</span
                >
              </div>
              <div class="border-t border-gray-200 pt-2 dark:border-orange-700">
                <div class="flex justify-between">
                  <span class="text-sm font-medium text-orange-600">Total Costs</span>
                  <span class="font-bold text-orange-500">
                    {formatDollarValue(totalCosts)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Order Status Card -->
      <div
        class="bg-base-100 rounded-xl border-2 border-slate-200 p-6 shadow-lg dark:border-slate-700"
      >
        <!-- Mobile toggle button -->
        <button
          class="mb-4 flex w-full items-center justify-between lg:hidden"
          onclick={() => toggleCard('status')}
        >
          <div class="flex items-center">
            <div class="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-600">
              <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m5 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-5 4h4"
                ></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-slate-600 dark:text-slate-300">
              Status • {order?.status || 'Unknown'}
            </h3>
          </div>
          <svg
            class="h-5 w-5 transform transition-transform {expandedCards.status
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

        <!-- Desktop header -->
        <div class="mb-4 hidden items-center lg:flex">
          <div class="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-600">
            <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m5 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-5 4h4"
              ></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-slate-600 dark:text-slate-400">Order Status</h3>
        </div>
        <!-- Collapsible content -->
        <div class="lg:block {expandedCards.status ? 'block' : 'hidden lg:block'}">
          <div class="space-y-3">
            <div>
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Current Status</p>
              <div class="flex items-center space-x-2">
                <span
                  class="inline-flex items-center rounded-lg px-4 py-2 text-lg font-bold shadow-sm {order?.status ===
                  'Shipped'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                    : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'}"
                >
                  {order?.status === 'Shipped' ? '✓' : '⏳'}
                  {order?.status || 'Unknown'}
                </span>
              </div>
            </div>
            {#if order?.tracking_number && order?.status === 'Shipped'}
              <div>
                <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Tracking Number
                </p>
                <p class="font-mono text-lg font-semibold text-slate-700 dark:text-slate-400">
                  {order.tracking_number}
                </p>
              </div>
            {/if}
            {#if order?.carrier && order?.status === 'Shipped'}
              <div>
                <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Carrier</p>
                <span
                  class="inline-block rounded-full bg-slate-500 px-3 py-1 text-sm font-medium text-white"
                >
                  {order.carrier}
                </span>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- ORDER OVERVIEW SECTION ENDS -->

  <!-- ORDER NOTES SECTION BEGINS -->
  {#if order?.notes && order?.notes.trim() !== ''}
    <div class="mb-8">
      <div
        class="bg-base-100 rounded-xl border-2 border-amber-200 p-6 shadow-lg dark:border-amber-700"
      >
        <!-- Header with icon and title -->
        <div class="mb-4 flex items-center">
          <div
            class="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600"
          >
            <svg class="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2v-7l-5-6z"
              ></path>
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 5l5 6v7a2 2 0 01-2 2H8a2 2 0 01-2-2V7a2 2 0 012-2h3l2-2z"
              ></path>
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-amber-600">Order Notes</h3>
            <p class="text-amber-500">Additional information about this order</p>
          </div>
        </div>

        <!-- Notes content -->
        <div
          class="rounded-lg border-2 border-amber-100 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
        >
          <div class="prose max-w-none">
            <p class="whitespace-pre-wrap leading-relaxed text-gray-900 dark:text-gray-100">
              {order.notes}
            </p>
          </div>
        </div>
      </div>
    </div>
  {/if}
  <!-- ORDER NOTES SECTION ENDS -->

  <!-- ORDER LINE ITEMS SECTION BEGINS -->
  <div class="mt-10 flex justify-center">
    <div class="bg-base-100 ml-10 mr-10 w-full max-w-full overflow-hidden rounded-lg p-4 shadow-xl">
      <h1 class="mb-5 text-center text-2xl font-bold">Order Line Items</h1>
      <!-- Mobile scroll indicator -->
      <div class="mb-3 text-center text-sm text-gray-500 md:hidden">
        <span class="rounded-md bg-gray-100 px-2 py-1"
          >← Scroll horizontally to see all columns →</span
        >
      </div>
      <div class="w-full overflow-x-auto">
        <table class="table-zebra table min-w-[1000px]">
          <thead>
            <tr>
              <th>Product Image</th>
              <th>Sku</th>
              <th>Cost of Good</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {#each orderLineItems as item}
              <tr>
                <td>
                  <img
                    class="h-12 w-12 rounded-md object-cover shadow-md"
                    alt={'Product thumbnail'}
                    src={item.image_url === null ? '/placeholder-image.jpg' : item.image_url}
                  />
                </td>
                <td>{item?.sku}</td>
                <td>{formatDollarValue(item?.cost_of_good)}</td>
                <td>{item?.quantity}</td>
                <td>{formatDollarValue(item?.unit_price)}</td>
                <td>{formatDollarValue(item?.line_total)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <!-- ORDER LINE ITEMS SECTION ENDS -->
</div>
