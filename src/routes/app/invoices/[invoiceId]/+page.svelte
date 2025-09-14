<script>
  import { goto } from '$app/navigation'
  import { formatDollarValue, isInvoicePastDue, csvGenerator } from '$lib/utils'

  /** @type {import('./$types').PageData} */
  let { data } = $props()

  const { invoice, invoiceLineItems, invoicedShipments } = data

  let showACHWireModal = $state(false)

  /**
   * Format date string to readable format
   * @param {string} dateString - The date string to format
   * @returns {string} Formatted date string
   */
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  let invoicedShipmentsExportData = $derived(
    invoicedShipments.map((shipment) => {
      return {
        shipment_date: shipment?.shipment_date,
        shipment_number: shipment?.shipment_number,
        recipient: shipment?.name,
        shipment_type: shipment?.shipment_type,
        units: shipment?.units_shipped,
        handling_units: shipment?.handling_units,
        total: shipment?.total_cost_of_shipment,
      }
    }),
  )

  function handleBackButtonClick() {
    goto('/app/invoices')
  }
</script>

<svelte:head>
  <title>Invoice {invoice.billing_month} - {invoice.brand_name}</title>
</svelte:head>

<div class="min-h-screen py-8">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <!-- Back Button -->
    <div class="mb-6">
      <button class="btn btn-outline btn-sm" onclick={handleBackButtonClick}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l5.293 5.293a1 1 0 010 1.414z"
            clip-rule="evenodd"
          />
        </svg>
        Back to Invoices
      </button>
    </div>

    <!-- Invoice Header -->
    <div
      style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);"
      class="mb-8 overflow-hidden rounded-2xl border border-gray-200 shadow-2xl"
    >
      <div class="p-8 text-white">
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between">
          <div class="flex-1">
            <div class="mb-2 text-2xl font-semibold uppercase tracking-wider text-blue-200">
              INVOICE
            </div>
            <div class="mb-3 flex items-center gap-4">
              <h1 class="text-4xl font-bold leading-tight">
                {invoice.billing_month}
              </h1>
              {#if isInvoicePastDue(invoice)}
                <div
                  class="badge badge-error badge-lg px-3 py-2 text-sm font-bold text-white shadow-lg"
                >
                  PAST DUE
                </div>
              {/if}
            </div>
            <div class="mb-6 flex items-center text-xl text-blue-100">
              <svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1.447.894L10 15.118l-4.553 1.776A1 1 0 014 16V4z"
                  clip-rule="evenodd"
                />
              </svg>
              {invoice.brand_name}
            </div>
          </div>
          <div
            class="rounded-xl border border-white/20 bg-white/15 p-6 text-center backdrop-blur-sm"
          >
            <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-200">
              Invoice Total
            </div>
            <div class="text-3xl font-bold">
              {formatDollarValue(invoice.invoice_total)}
            </div>
          </div>
        </div>

        <div class="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div class="rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
            <div class="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-200">
              Payment Status
            </div>
            <div
              class="badge {invoice.payment_status.toLowerCase() === 'paid'
                ? 'badge-success'
                : invoice.payment_status.toLowerCase() === 'pending'
                  ? 'badge-warning'
                  : 'badge-error'} badge-lg font-semibold"
            >
              {invoice.payment_status}
            </div>
          </div>
          {#if invoice.date_due}
            <div class="rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <div class="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-200">
                Due Date
              </div>
              <div class="text-lg font-semibold">{formatDate(invoice.date_due)}</div>
            </div>
          {/if}
          <div class="rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
            <div class="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-200">
              Invoice ID
            </div>
            <div class="font-mono text-sm font-medium">{invoice.id}</div>
          </div>
        </div>
      </div>
    </div>

    {#if invoice.payment_status !== 'Paid'}
      <!-- Payment Options Section -->
      <div class="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div class="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6 text-white">
          <h2 class="text-2xl font-bold">Payment Options</h2>
          <div class="text-sm text-green-100">Choose your preferred payment method</div>
        </div>

        <div class="p-8">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <a
              class="btn btn-primary btn-lg flex-1"
              href={invoice.stripe_invoice_url_credit_card}
              target="_blank"
            >
              <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                ></path>
              </svg>
              Pay By Credit Card
            </a>
            <a
              class="btn btn-info btn-lg flex-1"
              href={invoice.stripe_invoice_url_bank}
              target="_blank"
            >
              <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                ></path>
              </svg>
              Pay By Bank Transfer
            </a>
            <button
              onclick={() => (showACHWireModal = !showACHWireModal)}
              class="btn btn-secondary btn-lg flex-1"
            >
              <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                ></path>
              </svg>
              ACH/Wire Transfer
            </button>
          </div>

          {#if isInvoicePastDue(invoice)}
            <div class="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <div class="flex items-center">
                <svg class="mr-2 h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <p class="font-medium text-red-800">
                  This invoice is past due. Please make payment as soon as possible to avoid any
                  service interruptions.
                </p>
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Invoice Line Items -->
    <div class="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
      <div class="bg-gradient-to-r from-gray-700 to-gray-800 px-8 py-6 text-white">
        <h2 class="text-2xl font-bold">Services Provided</h2>
        <div class="text-sm text-blue-100">Detailed breakdown of invoice line items</div>
      </div>

      <div class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr class="bg-gray-50">
              <th class="p-6 text-left text-sm font-semibold uppercase tracking-wide text-gray-600"
                >Service</th
              >
              <th class="p-6 text-left text-sm font-semibold uppercase tracking-wide text-gray-600"
                >Terms</th
              >
              <th
                class="p-6 text-center text-sm font-semibold uppercase tracking-wide text-gray-600"
                >Qty</th
              >
              <th class="p-6 text-right text-sm font-semibold uppercase tracking-wide text-gray-600"
                >Price</th
              >
            </tr>
          </thead>
          <tbody>
            {#each invoiceLineItems as item, index}
              <tr
                class="transition-colors hover:bg-gray-50"
                class:border-b={index < invoiceLineItems.length - 1}
              >
                <td class="p-6 align-top">
                  <div class="mb-1 text-lg font-semibold text-gray-900">{item.item_name}</div>
                </td>
                <td class="p-6 align-top">
                  <div class="text-sm leading-relaxed text-gray-600">
                    The price for <strong class="text-gray-900">{item.item_name}</strong> was
                    calculated according to the terms of
                    <strong class="text-gray-900">{item.item_billing_terms}</strong>.
                  </div>
                </td>
                <td class="p-6 text-center align-top">
                  <div class="badge badge-lg bg-gray-100 font-semibold text-gray-800">
                    {item.item_quantity}
                  </div>
                </td>
                <td class="p-6 text-right align-top">
                  <div class="font-mono text-lg font-bold text-green-600">
                    {formatDollarValue(item.item_price * item.item_quantity)}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- PAYMENT BY ACH/WIRE MODAL BEGINS -->
<div class={`modal ${showACHWireModal ? 'modal-open' : ''}`}>
  <div class="modal-box bg-base-100 relative max-w-xs p-3 md:max-w-lg md:p-5">
    <button
      onclick={() => (showACHWireModal = false)}
      class="btn btn-circle btn-xs md:btn-sm absolute right-2 top-2">✕</button
    >

    <div class="bg-base-100 mt-3 rounded-lg p-3 shadow-md md:mt-5 md:p-4">
      <p class="mb-2 text-center text-base font-bold md:mb-3 md:text-xl">
        If paying by ACH or Wire, please use the following information:
      </p>

      <div class="mt-2 md:mt-3">
        <div class="mb-3 md:mb-4">
          <p class="text-base font-bold md:text-lg">Beneficiary Details:</p>
          <p class="mt-1 text-sm md:text-base">
            <strong>Name:</strong> Numble LLC<br />
            <strong>Type of Account:</strong> Checking<br />
            <strong>Address:</strong> 5505 O Street, Ste #4, Lincoln, NE 68510, USA
          </p>
        </div>
        <div class="mb-3 md:mb-4">
          <p class="text-base font-bold md:text-lg">Receiving Bank Details:</p>
          <p class="mt-1 text-sm md:text-base">
            <strong>Bank Name:</strong> Choice Financial Group<br />
            <strong>Bank Address:</strong> 4501 23rd Avenue S, Fargo, ND, 58104<br />
            <strong>Routing Number:</strong> 091311229<br />
            <strong>Account Number:</strong> 202486516073
          </p>
        </div>
      </div>

      <p class="mt-3 text-xs md:mt-4 md:text-sm">
        Please email <strong>accountsreceivable@hometown-industries.com</strong> confirmation after you
        have sent payment.
      </p>
    </div>
  </div>
</div>
<!-- PAYMENT BY ACH/WIRE MODAL ENDS -->
