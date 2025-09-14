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

  /** @type {Array<{product_name: string, total_units: number}>} */
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
        let displayedUnits = 0
        if (item.total_units === null || item.total_units === undefined) {
          displayedUnits = 0
        } else {
          displayedUnits = item.total_units
        }
        return {
          label: abbreviateString(item.product_name, 20),
          units: displayedUnits,
        }
      })

      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: parsedData.map((item) => item.label),
          datasets: [
            {
              label: 'Units Sold',
              data: parsedData.map((item) => item.units),
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
                  return `Units: ${value}`
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
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
