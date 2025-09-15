<script>
  // Import utility functions
  import {
    formatDollarValue,
    abbreviateString,
    convertDateString,
    convertDateToFindCategoryBudget,
    calculateSelectedMonthCashflow,
    findTransactionsForSelectedMonth,
    findSelectedCategoryBudget,
    convertDollarSignStringToNumber,
  } from '$lib/utils'

  // Import OnMount
  import { onMount } from 'svelte'

  // Import stores
  import { transactions, loadTransactions } from '$lib/stores/transactions'

  onMount(() => {
    loadTransactions()
  })

  // Components
  import Loading from '$lib/components/Loading.svelte'

  // Props
  export let selectedMonthAndYear
  export let chaseChecking
  export let categories
  export let creditCards

  // Total card balance from all credit cards
  $: totalCreditCardBalance = creditCards.reduce((total, creditCard) => {
    return total + convertDollarSignStringToNumber(creditCard['Card Balance'])
  }, 0)

  // How much available cash there is to spend
  $: currentNetCashBalance = chaseChecking - totalCreditCardBalance

  let selectedCategory = ''

  // All the transactions for the selected month and year
  $: monthTransactions = findTransactionsForSelectedMonth($transactions, selectedMonthAndYear)

  // All the transactions in a month that match the selected category
  $: categoryTransactions = monthTransactions.filter((transaction) => {
    if (selectedCategory === '') {
      return transaction
    }
    return transaction.Category === selectedCategory
  })

  // The value of all the transactions for a specific category in the selected month
  $: categoryTransactionsValue = categoryTransactions.reduce((acc, transaction) => {
    const amount = parseFloat(transaction.Amount.replace(/[$,]/g, ''))
    return acc + amount
  }, 0)

  // Format the date based on selected month and year for category budget lookup
  $: categoryDate = convertDateToFindCategoryBudget(selectedMonthAndYear)

  // Find the category object based on which category is selected
  $: selectedCategoryObject = categories.find((category) => {
    if (selectedCategory === '') {
      return 0
    }
    return category.Category === selectedCategory
  })

  $: {
    // console.log('SELECTED CATEGORY OBJECT', selectedCategoryObject)
    // console.log('CATEGORY DATE', categoryDate)
    console.log('Credit Cards', creditCards)
    console.log('Total card balance', totalCreditCardBalance)
  }

  // Access the budget property on the selected category object
  $: selectedCategoryBudget = findSelectedCategoryBudget(
    selectedCategory,
    categoryDate,
    selectedCategoryObject,
  )

  // The difference between category budget and month's actual value
  $: netCategoryDifference =
    categoryTransactionsValue > 0
      ? categoryTransactionsValue - selectedCategoryBudget
      : selectedCategoryBudget + categoryTransactionsValue

  // Number of transactions for the selected month and year
  $: numberOfTransactions = monthTransactions.length

  // Cash flow for the selected month
  $: cashFlow = calculateSelectedMonthCashflow(monthTransactions)

  // Net cash flow for the selected month
  $: netCashFlow = cashFlow.cashIn + cashFlow.cashOut

  let loading = false

  const updateTransactionCategory = async (transaction, newCategory) => {
    loading = true
    const transactionId = transaction['Transaction ID']
    console.log('TRANSACTION ID', transactionId)
    const response = await fetch('/app/api/updateTransactionCategory', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newCategory,
        transactionId,
      }),
    })
    if (response.ok) {
      loadTransactions()
    } else {
      const errorData = await response.json()
      alert(`Failed to edit habit: ${errorData.message}`)
    }
    loading = false
  }

  let hoveredTransactionId = null
  let timer

  function handleMouseEnter(id) {
    timer = setTimeout(() => {
      hoveredTransactionId = id
    }, 1000)
  }

  function handleMouseLeave() {
    clearTimeout(timer)
    hoveredTransactionId = null
  }
</script>

<Loading {loading} />
<div class="my-5 px-4">
  <div class="mx-auto w-full max-w-6xl rounded-lg bg-base-100 p-5 shadow-xl">
    <h1 class="mb-5 text-center text-2xl font-semibold">
      {#if selectedMonthAndYear !== ''}{convertDateString(selectedMonthAndYear)} -{/if} Transactions
    </h1>

    <!-- Buttons -->
    <div class="mb-4 flex flex-wrap justify-center gap-3">
      <a
        class="btn btn-outline btn-sm"
        href="https://docs.google.com/spreadsheets/d/1-9Zpc_zICLz4__fXs6xbkxyRUT94ZspJd9IrJnt8N38/edit?usp=sharing"
        target="_blank"
      >
        Open Transactions Sheet
      </a>

      <a class="btn btn-info btn-sm" on:click={() => loadTransactions()}>Load Transactions</a>
    </div>

    <!-- Bank & Credit Card Balances -->
    <div class="mx-auto mb-4 w-full max-w-md overflow-x-auto rounded-lg bg-base-100 p-4 shadow-lg">
      <table class="table w-full">
        <thead>
          <tr>
            <th>Current Bank Account Balance</th>
            <th>Current Credit Card Balance</th>
            <th>Current Net Cash Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{formatDollarValue(chaseChecking)}</td>
            <td>{formatDollarValue(totalCreditCardBalance)}</td>
            <td class={currentNetCashBalance > 0 ? 'text-green-600' : 'text-red-600'}>
              {formatDollarValue(currentNetCashBalance)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Transactions Summary -->
    <div class="mx-auto mb-5 w-full max-w-lg overflow-x-auto rounded-lg bg-base-100 p-4 shadow-lg">
      <table class="table w-full">
        <thead>
          <tr>
            <th># of Transactions</th>
            <th>Cash In</th>
            <th>Cash Out</th>
            <th>Net Cash Flow</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{numberOfTransactions}</td>
            <td>{formatDollarValue(cashFlow.cashIn)}</td>
            <td class="whitespace-nowrap">{formatDollarValue(cashFlow.cashOut)}</td>
            <td class={netCashFlow > 0 ? 'text-green-600' : 'text-red-600'}>
              {formatDollarValue(netCashFlow)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Categories Section -->
    <div class="mb-5 w-full rounded-lg bg-base-100 p-4 shadow-lg">
      <h1 class="mb-3 text-center text-xl font-semibold">Categories</h1>

      <!-- Category Buttons -->
      <div class="mb-5 mt-3 flex flex-wrap justify-center gap-2">
        {#each categories as category}
          <button
            class="btn btn-outline btn-info btn-sm {selectedCategory === category.Category
              ? 'btn-active'
              : ''}"
            on:click={() => (selectedCategory = category.Category)}
          >
            {category.Category}
          </button>
        {/each}
      </div>

      {#if selectedCategory !== ''}
        <div class="mb-2 rounded-lg p-4">
          <p class="mb-3 text-center text-lg font-semibold">
            <strong>{selectedCategory}</strong> =
            <span class={categoryTransactionsValue > 0 ? 'text-green-600' : 'text-red-600'}>
              {formatDollarValue(categoryTransactionsValue)}
            </span>
          </p>

          <!-- Budget Table -->
          <div class="mx-auto w-full max-w-lg overflow-x-auto rounded-lg bg-base-100 p-4 shadow-lg">
            <table class="table w-full">
              <thead>
                <tr>
                  <th>Month and Year</th>
                  <th>Category</th>
                  <th>Budgeted Amount</th>
                  <th>Actual Amount</th>
                  <th>Net Difference</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{convertDateString(selectedMonthAndYear)}</td>
                  <td>{selectedCategory}</td>
                  <td>{formatDollarValue(selectedCategoryBudget)}</td>
                  <td>{formatDollarValue(categoryTransactionsValue)}</td>
                  <td class={netCategoryDifference > 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatDollarValue(netCategoryDifference)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-4 flex justify-center">
            <button on:click={() => (selectedCategory = '')} class="btn btn-warning btn-sm">
              Reset
            </button>
          </div>
        </div>
      {/if}
    </div>

    <!-- Transactions Table -->
    <div class="overflow-x-auto rounded-lg bg-base-100 p-4 shadow-lg">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>Transaction Month</th>
            <th>Transaction Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Account</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {#each categoryTransactions as transaction}
            <tr>
              <td>{transaction['Month']}</td>
              <td>{transaction['Date']}</td>
              <td>
                <div
                  class="tooltip relative"
                  on:mouseenter={() => handleMouseEnter(transaction['Full Description'])}
                  on:mouseleave={handleMouseLeave}
                >
                  {abbreviateString(transaction['Full Description'], 34)}...
                  {#if hoveredTransactionId === transaction['Full Description']}
                    <span
                      class="tooltip-text absolute left-0 top-full mt-2 rounded-md bg-gray-800 p-2 text-white shadow-lg"
                    >
                      {abbreviateString(transaction['Full Description'], 500)}...
                    </span>
                  {/if}
                </div>
              </td>
              <td>{transaction['Category']}</td>
              <td>{transaction['Account']}</td>
              <td
                class={parseFloat(transaction['Amount'].replace(/[$,]/g, '')) > 0
                  ? 'text-green-600'
                  : 'text-red-600'}
              >
                {transaction['Amount']}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
