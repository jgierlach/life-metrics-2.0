<script>
  import { onMount, onDestroy } from 'svelte'
  import Chart from 'chart.js/auto'

  import {
    formatDollarValue,
    getCurrentMonthAndYear,
    filterTransactions,
    abbreviateString,
    getFirstMonthOfCurrentYear,
    csvGenerator,
    formatDate,
    formatGraphDate,
  } from '$lib/utils'

  export let categories
  export let bankTransactions
  export let monthsAndYears

  // let startDate = getFirstMonthOfCurrentYear()
  // let endDate = getCurrentMonthAndYear()

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  let startDate = formatDate(new Date(currentYear, currentMonth, 1))
  let endDate = formatDate(now)

  $: filteredTransactions = filterTransactions(bankTransactions, startDate, endDate)

  $: dateRangeCashFlow = filteredTransactions.reduce(
    (acc, transaction) => {
      const amount = parseFloat(transaction['Amount'].replace(/[$,]/g, ''))
      if (amount > 0) {
        acc.cashIn += amount
      } else if (amount < 0) {
        acc.cashOut += amount
      }
      return acc
    },
    { cashIn: 0, cashOut: 0 },
  )

  $: dateRangeNetCashFlow = dateRangeCashFlow.cashIn + dateRangeCashFlow.cashOut

  $: categoryNames = categories.map((category) => category.Category)

  $: transactionsByCategory = categoryNames
    .map((categoryName) => {
      const categoryTransactions = filteredTransactions.filter(
        (transaction) => transaction.Category === categoryName,
      )

      const totalValueOfCategoryTransactions = categoryTransactions.reduce(
        (accumulator, transaction) => {
          return accumulator + Math.abs(parseFloat(transaction.Amount.replace(/[$,]/g, '')))
        },
        0,
      )

      return {
        categoryName,
        categoryTransactions,
        totalValueOfCategoryTransactions,
      }
    })
    .filter(
      (category) =>
        category.categoryTransactions.length > 0 &&
        category.categoryTransactions.length !== undefined,
    )

  $: expenseCategories = transactionsByCategory.filter(
    (category) => category.categoryName !== 'Paycheck',
  )

  let selectedCategory = ''
  let selectedCategoryObject = {
    categoryName: '',
    categoryTransactions: [],
    totalValueOfCategoryTransactions: 0,
  }

  let barChart, pieChart
  let barCtx, pieCtx

  const fixedColors = [
    'rgba(75, 192, 192, 0.5)',
    'rgba(255, 99, 132, 0.5)',
    'rgba(153, 102, 255, 0.5)',
    'rgba(255, 206, 86, 0.5)',
    'rgba(54, 162, 235, 0.5)',
    'rgba(255, 159, 64, 0.5)',
    'rgba(201, 203, 207, 0.5)',
  ]

  const fixedBorderColors = fixedColors.map((color) => color.replace('0.5', '1'))

  onMount(() => {
    barCtx = document.getElementById('barChart').getContext('2d')
    pieCtx = document.getElementById('pieChart').getContext('2d')
    initCharts()
  })

  onDestroy(() => {
    if (barChart) barChart.destroy()
    if (pieChart) pieChart.destroy()
  })

  function initCharts() {
    barChart = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: ['Cash In', 'Cash Out', 'Net Cash Flow'],
        datasets: [
          {
            label: 'Amount',
            data: [dateRangeCashFlow.cashIn, dateRangeCashFlow.cashOut, dateRangeNetCashFlow],
            backgroundColor: [
              'rgba(75, 192, 192, 0.2)',
              'rgba(255, 99, 132, 0.2)',
              'rgba(153, 102, 255, 0.2)',
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)',
              'rgba(255, 99, 132, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    })

    pieChart = new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: expenseCategories.map((category) => category.categoryName),
        datasets: [
          {
            data: expenseCategories.map((category) => category.totalValueOfCategoryTransactions),
            backgroundColor: fixedColors.slice(0, expenseCategories.length),
            borderColor: fixedBorderColors.slice(0, expenseCategories.length),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.label || ''
                if (label) label += ': '
                if (context.raw !== null) label += formatDollarValue(context.raw)
                return label
              },
            },
          },
        },
      },
    })
  }

  $: {
    if (barChart) {
      barChart.data.datasets[0].data = [
        dateRangeCashFlow.cashIn,
        dateRangeCashFlow.cashOut,
        dateRangeNetCashFlow,
      ]
      barChart.update()
    }
  }

  $: {
    if (pieChart) {
      pieChart.data.labels = expenseCategories.map((category) => category.categoryName)
      pieChart.data.datasets[0].data = expenseCategories.map(
        (category) => category.totalValueOfCategoryTransactions,
      )
      pieChart.data.datasets[0].backgroundColor = fixedColors.slice(0, expenseCategories.length)
      pieChart.data.datasets[0].borderColor = fixedBorderColors.slice(0, expenseCategories.length)
      pieChart.update()
    }
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

  async function yearToDate() {
    const now = new Date()
    const currentYear = now.getFullYear()
    startDate = formatDate(new Date(currentYear, 0, 1))
    endDate = formatDate(now)
  }

  async function monthToDate() {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    startDate = formatDate(new Date(currentYear, currentMonth, 1))
    endDate = formatDate(now)
  }
</script>

<div class="mb-5 mt-5 flex justify-center px-4">
  <div class="w-full max-w-lg rounded-lg bg-base-100 p-4 shadow-lg">
    <h1 class="text-center text-2xl font-semibold">Select Date Range For Bank Transactions</h1>
    <div
      class="flex flex-col items-center justify-center space-y-4 md:flex-row md:space-x-4 md:space-y-0"
    >
      <div class="form-control w-full">
        <label class="label">
          <span class="label-text">Start Date</span>
        </label>
        <input type="date" bind:value={startDate} class="input input-bordered w-full" />
      </div>
      <div class="form-control w-full">
        <label class="label">
          <span class="label-text">End Date</span>
        </label>
        <input type="date" bind:value={endDate} class="input input-bordered w-full" />
      </div>
    </div>
    <div class="mt-5 flex flex-wrap justify-center gap-2">
      <button on:click={yearToDate} class="btn btn-secondary btn-sm">Year To Date</button>
      <button on:click={monthToDate} class="btn btn-secondary btn-sm">Month To Date</button>
    </div>
    <div class="mt-5 overflow-x-auto">
      <table class="table table-zebra w-full text-center">
        <thead>
          <tr>
            <th>Cash In</th>
            <th>Cash Out</th>
            <th>Net Cash Flow</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{formatDollarValue(dateRangeCashFlow.cashIn)}</td>
            <td>{formatDollarValue(dateRangeCashFlow.cashOut)}</td>
            <td class:green={dateRangeNetCashFlow > 0} class:red={dateRangeNetCashFlow < 0}>
              {formatDollarValue(dateRangeNetCashFlow)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<div class="mt-6 flex flex-wrap justify-center gap-5">
  <div class="chart-container w-full max-w-md bg-base-100">
    <h1 class="text-center text-xl font-semibold">Cash Flow</h1>
    <h2 class="mb-2 text-center text-sm">
      {formatGraphDate(startDate)} - {formatGraphDate(endDate)}
    </h2>
    <canvas id="barChart"></canvas>
  </div>
  <div class="chart-container w-full max-w-md bg-base-100">
    <h1 class="text-center text-xl font-semibold">Expenses</h1>
    <h2 class="mb-2 text-center text-sm">
      {formatGraphDate(startDate)} - {formatGraphDate(endDate)}
    </h2>
    <canvas id="pieChart"></canvas>
  </div>
</div>

<div class="mt-6 flex justify-center px-4">
  <div class="w-full max-w-6xl rounded-lg bg-base-100 p-4 shadow-lg">
    <h1 class="text-center text-xl font-semibold">Categories</h1>
    <div class="mb-2 mt-3 flex flex-wrap justify-center gap-2">
      {#each transactionsByCategory as category}
        <button
          class="btn btn-outline btn-info btn-sm"
          class:btn-active={selectedCategory === category.categoryName}
          on:click={() => {
            selectedCategory = category.categoryName
            selectedCategoryObject = category
          }}
        >
          {category.categoryName}
        </button>
      {/each}
    </div>
    <div class="mb-4 flex justify-center">
      <button on:click={() => (selectedCategory = 'Uncategorized')} class="btn btn-outline btn-sm">
        Uncategorized
      </button>
    </div>

    {#if selectedCategory !== ''}
      <div class="mb-5 flex justify-center">
        <div class="w-full max-w-lg p-4 shadow-md">
          <table class="table-compact table w-full shadow-md">
            <thead>
              <tr>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Category Name</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{startDate}</td>
                <td>{endDate}</td>
                <td>{selectedCategory}</td>
                <td>{formatDollarValue(selectedCategoryObject.totalValueOfCategoryTransactions)}</td
                >
              </tr>
            </tbody>
          </table>
          <div class="mt-4 flex flex-wrap justify-center gap-2">
            <button
              on:click={csvGenerator(
                selectedCategoryObject.categoryTransactions,
                Object.keys(selectedCategoryObject.categoryTransactions[0]),
                Object.keys(selectedCategoryObject.categoryTransactions[0]),
                `${startDate}-${endDate}-${selectedCategory}.csv`,
              )}
              class="btn btn-info btn-sm"
            >
              Export to CSV
            </button>
            <button on:click={() => (selectedCategory = '')} class="btn btn-warning btn-sm">
              Reset
            </button>
          </div>
        </div>
      </div>
    {/if}

    <div class="mt-4 overflow-x-auto">
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
          {#each selectedCategoryObject.categoryTransactions as transaction}
            <tr>
              <td>{transaction['Month']}</td>
              <td>{transaction['Date']}</td>
              <td>
                <div class="tooltip">
                  {abbreviateString(transaction['Full Description'], 34)}...
                  <span class="tooltip-text"
                    >{abbreviateString(transaction['Full Description'], 500)}...</span
                  >
                </div>
              </td>
              <td>{transaction['Category']}</td>
              <td>{transaction['Account']}</td>
              <td
                class:green={parseFloat(transaction['Amount'].replace(/[$,]/g, '')) > 0}
                class:red={parseFloat(transaction['Amount'].replace(/[$,]/g, '')) < 0}
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

<style>
  .chart-container {
    max-width: 500px;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  .tooltip:hover .tooltip-text {
    display: block;
  }
  .tooltip-text {
    display: none;
    position: absolute;
    z-index: 10;
  }
</style>
