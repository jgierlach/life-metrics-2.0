<script>
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

  let { data = [] } = $props()

  /** @type {HTMLCanvasElement | null} */
  let canvas = null
  /** @type {import('chart.js').Chart | null} */
  let chart = null

  const createChart = () => {
    if (canvas && data.length > 0) {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const parsedData = data.map((item) => {
        return {
          label: item.habit_name,
          count: item.count,
        }
      })

      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: parsedData.map((item) => item.label),
          datasets: [
            {
              label: 'Habit Completions',
              data: parsedData.map((item) => item.count),
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
                  const value = context.raw
                  return `Completed ${value} times`
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

  $effect(() => {
    if (!canvas || data.length === 0) {
      destroyChart()
      return
    }
    destroyChart()
    createChart()
    return destroyChart
  })
</script>

<div class="flex items-center justify-center bg-base-100">
  <div class="h-96 w-full max-w-3xl rounded-lg bg-base-100 p-6 shadow-lg">
    <canvas bind:this={canvas} class="h-full w-full"></canvas>
  </div>
</div>
