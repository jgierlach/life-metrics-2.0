<script>
  import { onMount, afterUpdate, onDestroy } from 'svelte'
  import {
    Chart,
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
  } from 'chart.js'

  Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip)

  // Import utility functions
  import { abbreviateString } from '$lib/utils'

  /** @type {Array<{product_name: string, total_revenue: number}>} */
  export let data = []

  /** @type {HTMLCanvasElement} */
  let canvas
  /** @type {Chart | null} */
  let chart = null

  const createChart = () => {
    if (canvas && data.length > 0) {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const parsedData = data.map((item) => {
        let displayedRevenue = 0
        if (item.total_revenue === null || item.total_revenue === undefined) {
          displayedRevenue = 0
        } else {
          displayedRevenue = item.total_revenue
        }
        return {
          label: abbreviateString(item.product_name, 20),
          revenue: displayedRevenue,
        }
      })

      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: parsedData.map((item) => item.label),
          datasets: [
            {
              label: 'Sales (in dollars)',
              data: parsedData.map((item) => item.revenue),
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: '',
              font: {
                size: 18,
                weight: 'bold',
              },
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const value = /** @type {number} */ (context.raw)
                  return `Sales: $${value.toLocaleString()}`
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  return '$' + value
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
