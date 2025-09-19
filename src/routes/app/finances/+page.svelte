<script>
  import { generateMonthsAndYears, getCurrentMonthAndYear } from '$lib/utils'
  import DateRangeTransactions from '$lib/components/DateRangeTransactions.svelte'
  import CashFlow from '$lib/components/CashFlow.svelte'
  import CostToLive from '$lib/components/CostToLive.svelte'
  import CreditCards from '$lib/components/CreditCards.svelte'
  import BalanceSheet from '$lib/components/BalanceSheet.svelte'
  import TaxReturns from '$lib/components/TaxReturns.svelte'

  let { data } = $props()
  const { creditCards, assets, debts, taxReturns, transactions, categories } = data

  $effect(() => {
    console.log('Credit Cards', creditCards)
    console.log('Assets', assets)
    console.log('Debts', debts)
    console.log('Tax Returns', taxReturns)
    console.log('Transactions', transactions)
    console.log('Categories', categories)
  })

  let selectedMonthAndYear = $state(getCurrentMonthAndYear())
  let monthsAndYears = $derived(generateMonthsAndYears(transactions))

  let selectedTab = $state('Date Range Transactions')
</script>

<div class="flex justify-center px-4">
  <div class="mt-6 w-full max-w-3xl rounded-lg bg-base-100 p-6 shadow-md">
    <h1 class="mb-4 text-center text-2xl font-semibold">Select Month And Year</h1>
    <div class="mb-4 flex justify-center">
      <select class="select select-bordered w-full max-w-xs" bind:value={selectedMonthAndYear}>
        {#each monthsAndYears as monthAndYear}
          <option>{monthAndYear}</option>
        {/each}
      </select>
    </div>
    <div class="mb-4">
      <div class="tabs flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onclick={() => (selectedTab = 'Date Range Transactions')}
          class="btn btn-ghost px-2 text-sm md:px-4 md:text-base {selectedTab ===
          'Date Range Transactions'
            ? 'btn-active'
            : ''}"
        >
          Date Range Transactions
        </button>
        <button
          type="button"
          onclick={() => (selectedTab = 'Cash Flow')}
          class="btn btn-ghost px-2 text-sm md:px-4 md:text-base {selectedTab === 'Cash Flow'
            ? 'btn-active'
            : ''}"
        >
          Cash Flow
        </button>
        <button
          type="button"
          onclick={() => (selectedTab = 'Cost To Live')}
          class="btn btn-ghost px-2 text-sm md:px-4 md:text-base {selectedTab === 'Cost To Live'
            ? 'btn-active'
            : ''}"
        >
          Cost To Live
        </button>
        <button
          type="button"
          onclick={() => (selectedTab = 'Balance Sheet')}
          class="btn btn-ghost px-2 text-sm md:px-4 md:text-base {selectedTab === 'Balance Sheet'
            ? 'btn-active'
            : ''}"
        >
          Balance Sheet
        </button>
        <button
          type="button"
          onclick={() => (selectedTab = 'Credit Cards')}
          class="btn btn-ghost px-2 text-sm md:px-4 md:text-base {selectedTab === 'Credit Cards'
            ? 'btn-active'
            : ''}"
        >
          Credit Card Utilization
        </button>
        <button
          type="button"
          onclick={() => (selectedTab = 'Tax Returns')}
          class="btn btn-ghost px-2 text-sm md:px-4 md:text-base {selectedTab === 'Tax Returns'
            ? 'btn-active'
            : ''}"
        >
          Tax Returns
        </button>
      </div>
    </div>
  </div>
</div>

{#if selectedTab === 'Date Range Transactions'}
  <DateRangeTransactions bankTransactions={transactions} {categories} {monthsAndYears} />
{/if}

{#if selectedTab === 'Cash Flow'}
  <CashFlow {selectedMonthAndYear} chaseChecking={0} {categories} {creditCards} />
{/if}

{#if selectedTab === 'Balance Sheet'}
  <BalanceSheet {assets} {debts} />
{/if}

{#if selectedTab === 'Cost To Live'}
  <CostToLive {selectedMonthAndYear} {categories} />
{/if}

{#if selectedTab === 'Credit Card'}
  <CreditCards {creditCards} />
{/if}

{#if selectedTab === 'Tax Returns'}
  <TaxReturns />
{/if}
