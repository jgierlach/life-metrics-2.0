<script>
  import { onMount, afterUpdate, onDestroy } from 'svelte'
  import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Title,
    Tooltip,
  } from 'chart.js'

  Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Title,
    Tooltip,
  )

  /** @type {Array<{month: string, totalUnitsSold: number}>} */
  export let unitsSoldByMonth = []

  /** @type {HTMLCanvasElement} */
  let canvas
  /** @type {Chart | null} */
  let chart = null

  const createChart = () => {
    if (canvas && unitsSoldByMonth.length > 0) {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const parsedData = unitsSoldByMonth.map((item) => ({
        month: item.month,
        total_units_sold: item?.totalUnitsSold,
      }))

      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: parsedData.map((item) => item.month),
          datasets: [
            {
              label: 'Total Units Sold',
              data: parsedData.map((item) => item.total_units_sold),
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Units Sold',
              font: {
                size: 18,
                weight: 'bold',
              },
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const value = /** @type {number} */ (context.raw)
                  return `Units Sold: ${value}`
                },
              },
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Date',
              },
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Units Sold',
              },
              ticks: {
                callback: function (value) {
                  return value
                },
              },
            },
          },
        },
      })
    }
  }

  const destroyChart = () => {
    if (chart) {
      chart.destroy()
      chart = null
    }
  }

  onMount(() => {
    createChart()
  })

  afterUpdate(() => {
    destroyChart()
    createChart()
  })

  onDestroy(() => {
    destroyChart()
  })
</script>

<div class="flex items-center justify-center bg-base-100">
  <div class="h-96 w-full max-w-3xl rounded-lg bg-base-100 p-6 shadow-lg">
    <canvas bind:this={canvas} class="h-full w-full"></canvas>
  </div>
</div>
