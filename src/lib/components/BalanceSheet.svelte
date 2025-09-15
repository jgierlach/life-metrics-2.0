<script>
  import { formatDollarValue, convertDollarSignStringToNumber } from '$lib/utils'

  export let assets
  export let debts

  $: totalAssets = assets
    .map((asset) => convertDollarSignStringToNumber(asset['Asset Amount']))
    .reduce((accumulator, currentValue) => {
      return accumulator + currentValue
    }, 0)

  $: totalDebts = debts
    .map((debt) => convertDollarSignStringToNumber(debt['Debt Amount']))
    .reduce((accumulator, currentValue) => {
      return accumulator + currentValue
    }, 0)

  $: equity = totalAssets - totalDebts

  $: {
    console.log('DEBTS', debts)
    console.log('ASSETS', assets)
    console.log('TOTAL ASSETS', totalAssets)
  }
</script>

<div class="mt-6 flex flex-wrap justify-center gap-6 px-4">
  <!-- Assets Card -->
  <div class="w-full max-w-lg">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body p-0">
        <div class="flex justify-center">
          <h1 class="card-title p-4 text-center text-2xl">Assets</h1>
        </div>
        <div class="mb-4 flex justify-center">
          <div class="w-full bg-base-100 p-4 shadow-md">
            <div class="overflow-x-auto">
              <table class="table w-full text-center">
                <thead>
                  <tr>
                    <th>Total Asset Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{formatDollarValue(totalAssets)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="flex justify-center">
          <div class="w-full overflow-x-auto">
            <table class="table w-full text-center">
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Asset Amount</th>
                </tr>
              </thead>
              <tbody>
                {#each assets as asset}
                  <tr>
                    <td>{asset['Asset Name']}</td>
                    <td>${asset['Asset Amount']}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Liabilities Card -->
  <div class="w-full max-w-lg">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body p-0">
        <div class="flex justify-center">
          <h1 class="card-title p-4 text-center text-2xl">Liabilities</h1>
        </div>
        <div class="mb-4 flex justify-center">
          <div class="w-full bg-base-100 p-4 shadow-md">
            <div class="overflow-x-auto">
              <table class="table w-full text-center">
                <thead>
                  <tr>
                    <th>Total Debt Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{formatDollarValue(totalDebts)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="flex justify-center">
          <div class="w-full overflow-x-auto">
            <table class="table w-full text-center">
              <thead>
                <tr>
                  <th>Debt Name</th>
                  <th>Debt Amount</th>
                </tr>
              </thead>
              <tbody>
                {#each debts as debt}
                  <tr>
                    <td>{debt['Debt Name']}</td>
                    <td>${debt['Debt Amount']}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Equity Card -->
<div class="mb-5 mt-6 px-4">
  <div class="mx-auto w-full max-w-lg">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body p-0">
        <div class="flex justify-center">
          <h1 class="card-title p-4 text-center text-2xl">Equity</h1>
        </div>
        <div class="overflow-x-auto">
          <table class="table w-full text-center">
            <thead>
              <tr>
                <th>Assets</th>
                <th>Liabilities</th>
                <th>Equity</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{formatDollarValue(totalAssets)}</td>
                <td>{formatDollarValue(totalDebts)}</td>
                <td class={equity > 0 ? 'text-success' : 'text-error'}>
                  {formatDollarValue(equity)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>
