<script>
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { invoices, loadInvoices } from '$lib/stores/invoices'
  // Import utils
  import {
    formatDollarValue,
    isInvoicePastDue,
    formatDateForInvoices,
    compareInvoicesByBillingMonthDesc,
  } from '$lib/utils.js'

  let { data } = $props()
  /** @type {string} */
  let brandId = $derived(data?.session?.user?.email ?? '')

  let showACHWireModal = $state(false)

  let invoicesFromMostRecentToOldest = $derived(
    [...$invoices].sort(compareInvoicesByBillingMonthDesc),
  )

  onMount(async () => {
    if (!brandId) return
    await loadInvoices(data.supabase, brandId)
  })
</script>

<div class="mt-4 flex justify-center px-2 md:mt-10 md:px-0">
  <div class="w-full max-w-5xl rounded-lg bg-base-100 p-3 shadow-xl md:p-4">
    <h1 class="text-center text-xl font-bold md:text-3xl">Invoices</h1>

    <div class="flex justify-center">
      <div class="mt-3 w-full overflow-x-auto md:mt-5">
        <table class="table table-zebra table-xs text-xs md:table-md md:text-base">
          <thead>
            <tr>
              <th>Billing Month</th>
              <th class="hidden md:table-cell">Payment Due</th>
              <th>Payment Status</th>
              <th>Amount Due</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each invoicesFromMostRecentToOldest as invoice}
              <tr class:!bg-red-100={isInvoicePastDue(invoice)}>
                <td class="whitespace-nowrap"
                  ><a
                    href={`/app/invoices/${invoice?.id}`}
                    class="link-hover link-primary font-semibold">{invoice.billing_month}</a
                  ></td
                >
                <td class="hidden md:table-cell">{formatDateForInvoices(invoice.date_due)}</td>
                <td>
                  <div
                    class="flex flex-col space-y-1 md:flex-row md:items-center md:space-x-2 md:space-y-0"
                  >
                    <button
                      class="btn btn-xs md:btn-sm"
                      class:btn-accent={invoice.payment_status === 'Paid'}
                      class:btn-error={invoice.payment_status === 'Unpaid'}
                    >
                      {invoice.payment_status}
                    </button>
                    {#if isInvoicePastDue(invoice)}
                      <span
                        class="badge badge-error whitespace-nowrap px-1 py-1 text-center text-[10px] leading-none md:px-2 md:text-xs"
                        >Past Due</span
                      >
                    {/if}
                  </div>
                </td>
                <td class="whitespace-nowrap">{formatDollarValue(invoice.invoice_total)}</td>
                <td>
                  <div class="flex flex-col space-y-1 md:flex-row md:space-x-1 md:space-y-0">
                    <a
                      class="btn btn-warning btn-xs text-[10px] md:btn-sm md:text-xs"
                      href={`/app/invoices/${invoice?.id}`}
                      target="_blank"
                    >
                      View Invoice
                    </a>
                    <a
                      class="btn btn-primary btn-xs text-[10px] md:btn-sm md:text-xs"
                      href={invoice.stripe_invoice_url_credit_card}
                      target="_blank"
                    >
                      Pay By Card
                    </a>
                    <a
                      class="btn btn-info btn-xs text-[10px] md:btn-sm md:text-xs"
                      href={invoice.stripe_invoice_url_bank}
                      target="_blank"
                    >
                      Pay By Bank
                    </a>
                    <button
                      onclick={() => (showACHWireModal = !showACHWireModal)}
                      class="btn btn-secondary btn-xs text-[10px] md:btn-sm md:text-xs"
                    >
                      ACH/Wire
                    </button>
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
  <div class="modal-box relative max-w-xs bg-base-100 p-3 md:max-w-lg md:p-5">
    <button
      onclick={() => (showACHWireModal = false)}
      class="btn btn-circle btn-xs absolute right-2 top-2 md:btn-sm">✕</button
    >

    <div class="mt-3 rounded-lg bg-base-100 p-3 shadow-md md:mt-5 md:p-4">
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
