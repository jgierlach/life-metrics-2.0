<script>
  // Import utility functions
  import {
    formatDollarValue,
    abbreviateString,
    convertDateString,
    convertDateToFindCategoryBudget,
    convertDollarSignStringToNumber,
    calculateSelectedMonthCashflow,
    findTransactionsForSelectedMonth,
    findCategoryBudgetForSelectedMonth,
  } from '$lib/utils'

  let { data } = $props()
  const { transactions, categories, selectedMonthAndYear } = data

  let monthTransactions = $derived(
    findTransactionsForSelectedMonth(transactions, selectedMonthAndYear),
  )

  // Cash flow for the selected month
  let cashFlow = $derived(calculateSelectedMonthCashflow(monthTransactions))

  // Pull cash leaving the account to get actual expenses for the month
  let actualExpensesForSelectedMonth = $derived(cashFlow.cashOut)

  let actualIncomeForSelectedMonth = $derived(cashFlow.cashIn)

  let actualCashFlowForSelectedMonth = $derived(
    actualIncomeForSelectedMonth + actualExpensesForSelectedMonth,
  )

  let categoryBudgetsForSelectedMonth = $derived(
    categories
      .filter((category) => category.Category !== 'Paycheck')
      .map((category) => {
        if (selectedMonthAndYear === '') {
          return []
        }
        return {
          categoryName: category.Category,
          categoryBudgetForMonth: convertDollarSignStringToNumber(
            category[convertDateToFindCategoryBudget(selectedMonthAndYear)],
          ),
        }
      }),
  )

  let transactionsByCategoryForSelectedMonth = $derived(
    categories
      .map((category) => category.Category)
      .map((categoryName) => {
        const categoryTransactions = monthTransactions.filter(
          (transaction) => transaction.Category === categoryName,
        )
        const actualCategorySpending = categoryTransactions.reduce((accumulator, transaction) => {
          return accumulator + parseFloat(transaction.Amount.replace(/[$,]/g, ''))
        }, 0)
        const categoryBudget = findCategoryBudgetForSelectedMonth(
          categoryName,
          categoryBudgetsForSelectedMonth,
        )
        const budgetRemaining = categoryBudget + actualCategorySpending
        return {
          categoryTransactions: categoryTransactions,
          categoryName: categoryName,
          categoryBudget: categoryBudget,
          actualCategorySpending: actualCategorySpending,
          budgetRemaining: budgetRemaining,
        }
      }),
  )

  let discrectionaryCategoryBudgetsForSelectedMonth = $derived(
    transactionsByCategoryForSelectedMonth.filter(
      (category) =>
        category.categoryName === 'Restaurants' ||
        category.categoryName === 'Gear & Clothing' ||
        category.categoryName === 'Travel' ||
        category.categoryName === 'Gas' ||
        category.categoryName === 'Groceries' ||
        category.categoryName === 'Entertainment',
    ),
  )

  let budgetedDiscretionarySpendForSelectedMonth = $derived(
    discrectionaryCategoryBudgetsForSelectedMonth
      .map((category) => category.categoryBudget)
      .reduce((total, current) => {
        return total + current
      }, 0),
  )

  let actualDiscretionarySpendForSelectedMonth = $derived(
    discrectionaryCategoryBudgetsForSelectedMonth
      .map((category) => category.actualCategorySpending)
      .reduce((total, current) => {
        return total + current
      }, 0),
  )

  let discretionarySpendAvailable = $derived(
    budgetedDiscretionarySpendForSelectedMonth + actualDiscretionarySpendForSelectedMonth,
  )

  let showDiscretionarySpend = $state(false)

  let categoryBudgetsToDisplayForSelectedMonth = $derived(
    showDiscretionarySpend
      ? discrectionaryCategoryBudgetsForSelectedMonth
      : transactionsByCategoryForSelectedMonth,
  )

  let estimatedExpensesForSelectedMonth = $derived(
    categoryBudgetsForSelectedMonth.reduce((total, current) => {
      return total + current.categoryBudgetForMonth
    }, 0),
  )

  let estimatedMonthlyIncome = 5000

  let estimatedCashflowForSelectedMonth = $derived(
    estimatedMonthlyIncome - estimatedExpensesForSelectedMonth,
  )

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

<div class="my-5 px-4">
  <div class="mx-auto w-full max-w-6xl rounded-lg bg-base-100 p-5 shadow-xl">
    <h1 class="mb-5 text-center text-2xl font-semibold">
      {convertDateString(selectedMonthAndYear)} - Budgets
    </h1>

    <!-- Action Buttons -->
    <div class="mb-2 flex flex-wrap justify-center gap-2">
      <a
        class="btn btn-outline btn-sm"
        href="https://docs.google.com/spreadsheets/d/1-9Zpc_zICLz4__fXs6xbkxyRUT94ZspJd9IrJnt8N38/edit?pli=1#gid=1366405697"
        target="_blank"
      >
        Open Categories
      </a>
      <button onclick={() => console.log('categories')} class="btn btn-info btn-sm">
        Load Categories
      </button>
    </div>

    <!-- Toggle Discretionary Spend -->
    <div class="mb-4 flex justify-center">
      <button
        onclick={() => (showDiscretionarySpend = !showDiscretionarySpend)}
        class="btn btn-outline btn-primary btn-sm"
      >
        {showDiscretionarySpend ? 'Hide' : 'Show'} Discretionary Spend
      </button>
    </div>

    {#if showDiscretionarySpend}
      <!-- Discretionary Spend Table -->
      <div
        class="mx-auto mb-5 w-full max-w-md overflow-x-auto rounded-lg bg-base-100 p-4 shadow-lg"
      >
        <table class="table w-full">
          <thead>
            <tr>
              <th>Budgeted Disc Spend</th>
              <th>Actual Disc Spend</th>
              <th>Disc Spend Available</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{formatDollarValue(budgetedDiscretionarySpendForSelectedMonth)}</td>
              <td>{formatDollarValue(actualDiscretionarySpendForSelectedMonth)}</td>
              <td class={discretionarySpendAvailable > 0 ? 'text-green-600' : 'text-red-600'}>
                {formatDollarValue(discretionarySpendAvailable)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    {:else}
      <!-- Monthly Budget Tables -->
      <div
        class="mx-auto mb-5 w-full max-w-md overflow-x-auto rounded-lg bg-base-100 p-4 shadow-lg"
      >
        <table class="table w-full">
          <thead>
            <tr>
              <th>Budgeted Expenses</th>
              <th>Budgeted Income</th>
              <th>Budgeted Cashflow</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{formatDollarValue(estimatedExpensesForSelectedMonth)}</td>
              <td>{formatDollarValue(estimatedMonthlyIncome)}</td>
              <td class={estimatedCashflowForSelectedMonth > 0 ? 'text-green-600' : 'text-red-600'}>
                {formatDollarValue(estimatedCashflowForSelectedMonth)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        class="mx-auto mb-5 w-full max-w-md overflow-x-auto rounded-lg bg-base-100 p-4 shadow-lg"
      >
        <table class="table w-full">
          <thead>
            <tr>
              <th>Actual Expenses</th>
              <th>Actual Income</th>
              <th>Actual Cashflow</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{formatDollarValue(actualExpensesForSelectedMonth)}</td>
              <td>{formatDollarValue(actualIncomeForSelectedMonth)}</td>
              <td class={actualCashFlowForSelectedMonth > 0 ? 'text-green-600' : 'text-red-600'}>
                {formatDollarValue(actualCashFlowForSelectedMonth)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    {/if}

    <h1 class="mb-3 text-center text-xl font-semibold">
      {showDiscretionarySpend ? 'Budgeted Discretionary Spending' : 'Monthly Budgets By Category'}
    </h1>

    <!-- Category Budgets Table -->
    <div class="overflow-x-auto rounded-lg bg-base-100 p-4 shadow-lg">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>Month and Year</th>
            <th>Category</th>
            <th>Budget</th>
            <th>Actual Spending</th>
            <th>Budget Remaining</th>
          </tr>
        </thead>
        <tbody>
          {#each categoryBudgetsToDisplayForSelectedMonth as category}
            <tr>
              <td>{convertDateString(selectedMonthAndYear)}</td>
              <td>
                <a href={`/app/finances/#${category.categoryName}`} class="font-semibold">
                  {category.categoryName}
                </a>
              </td>
              <td>{formatDollarValue(category.categoryBudget)}</td>
              <td>{formatDollarValue(category.actualCategorySpending)}</td>
              <td class={category.budgetRemaining > 0 ? 'text-green-600' : 'text-red-600'}>
                {formatDollarValue(category.budgetRemaining)}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#each transactionsByCategoryForSelectedMonth as categoryTransactions}
      {#if categoryTransactions.categoryTransactions.length > 0}
        <div id={categoryTransactions.categoryName} class="mb-5 mt-4">
          <div class="mx-auto w-full max-w-4xl rounded-lg bg-base-100 p-4 shadow-lg">
            <h1 class="mb-3 text-center text-xl font-semibold">
              {categoryTransactions.categoryName}
            </h1>

            <div class="flex justify-center">
              <div class=" mb-5 max-w-lg overflow-x-auto rounded-lg bg-base-100 p-4 shadow-lg">
                <table class="table w-full">
                  <thead>
                    <tr>
                      <th>Budget</th>
                      <th>Actual Spending</th>
                      <th>Budget Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{formatDollarValue(categoryTransactions.categoryBudget)}</td>
                      <td>{formatDollarValue(categoryTransactions.actualCategorySpending)}</td>
                      <td
                        class={categoryTransactions.budgetRemaining > 0
                          ? 'text-green-600'
                          : 'text-red-600'}
                      >
                        {formatDollarValue(categoryTransactions.budgetRemaining)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Transactions Table -->
            <div class="overflow-x-auto">
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
                  {#each categoryTransactions.categoryTransactions as transaction}
                    <tr>
                      <td>{transaction['Month']}</td>
                      <td>{transaction['Date']}</td>
                      <td class="whitespace-nowrap">{transaction['Full Description']}</td>
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
      {/if}
    {/each}
  </div>
</div>
