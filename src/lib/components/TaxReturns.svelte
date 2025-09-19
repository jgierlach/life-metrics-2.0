<script>
  let { data } = $props()
  const taxReturns = data
</script>

<div class="my-5 px-4">
  <div class="mx-auto w-full max-w-2xl overflow-x-auto">
    <table class="table w-full bg-base-100">
      <thead>
        <tr>
          <th>Year</th>
          <th>Return Type</th>
          <th>Link To Return</th>
          <th>Proof Of Payment</th>
        </tr>
      </thead>
      <tbody>
        {#each taxReturns as taxReturn}
          <tr>
            <td>{taxReturn.Year}</td>
            <td>{taxReturn['Return Type']}</td>
            <td>
              <a href={taxReturn['Link To Return']} class="text-blue-500 underline" target="_blank">
                Return Link
              </a>
            </td>
            <td>
              <a
                href={taxReturn['Proof Of Payment']}
                class="text-blue-500 underline"
                target="_blank"
              >
                Payment Proof
              </a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
