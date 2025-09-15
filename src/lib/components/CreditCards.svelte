<script>
  import {
    formatDollarValue,
    formatToPercentage,
    convertDollarSignStringToNumber,
  } from '$lib/utils'

  export let creditCards
</script>

<div class="my-5 px-4">
  <div class="mx-auto w-full max-w-2xl overflow-x-auto">
    <table class="table w-full bg-base-100">
      <thead>
        <tr>
          <th>Card Name</th>
          <th>Card Balance</th>
          <th>Card Limit</th>
          <th>Credit Utilization</th>
        </tr>
      </thead>
      <tbody>
        {#each creditCards as creditCard}
          <tr>
            <td>{creditCard['Card Name']}</td>
            <td>{formatDollarValue(convertDollarSignStringToNumber(creditCard['Card Balance']))}</td
            >
            <td>{formatDollarValue(convertDollarSignStringToNumber(creditCard['Card Limit']))}</td>
            <td>
              {formatToPercentage(
                convertDollarSignStringToNumber(creditCard['Card Balance']) /
                  convertDollarSignStringToNumber(creditCard['Card Limit']),
              )}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
