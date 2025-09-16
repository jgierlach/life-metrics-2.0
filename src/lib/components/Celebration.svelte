<script>
  import { onMount } from 'svelte'
  export let message = 'Entry posted!'

  /** @typedef {{ x:number, y:number, vx:number, vy:number, rotation:number, vr:number, size:number, color:string, shape:'rect'|'circle'|'triangle' }} Particle */

  /** @type {HTMLCanvasElement | null} */
  let canvas = null
  /** @type {CanvasRenderingContext2D | null} */
  let ctx = null
  /** @type {number | null} */
  let raf = null
  /** @type {Particle[]} */
  let particles = []
  /** @type {number | null} */
  let startTime = null
  /** @type {ResizeObserver | null} */
  let ro = null

  function resize() {
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.floor(rect.width * dpr)
    canvas.height = Math.floor(rect.height * dpr)
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function initParticles() {
    if (!canvas) return
    particles = []
    const colors = ['#93C5FD', '#A7F3D0', '#FDE68A', '#FBCFE8', '#C4B5FD', '#FDBA74']
    const { width, height } = canvas.getBoundingClientRect()
    const count = 160
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 3)
      const speed = 3 + Math.random() * 4
      particles.push({
        x: width / 2,
        y: height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        size: 4 + Math.random() * 6,
        color: colors[i % colors.length],
        shape: Math.random() < 0.33 ? 'rect' : Math.random() < 0.5 ? 'circle' : 'triangle',
      })
    }
  }

  /** @param {number} ts */
  function step(ts) {
    if (!canvas || !ctx) return
    if (!startTime) startTime = ts
    const rect = canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, rect.width, rect.height)

    for (const p of particles) {
      p.vy += 0.05
      p.vx *= 0.99
      p.vy *= 0.99
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.vr

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.fillStyle = p.color
      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
      } else if (p.shape === 'circle') {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.moveTo(0, -p.size / 1.2)
        ctx.lineTo(p.size / 1.2, p.size / 1.2)
        ctx.lineTo(-p.size / 1.2, p.size / 1.2)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()
    }

    if (startTime !== null && ts - startTime < 1800) {
      raf = requestAnimationFrame(step)
    }
  }

  onMount(() => {
    if (!canvas) return
    ctx = canvas.getContext('2d')
    ro = new ResizeObserver(() => {
      resize()
      initParticles()
    })
    if (canvas) ro.observe(canvas)
    resize()
    initParticles()
    raf = requestAnimationFrame(step)

    return () => {
      if (raf !== null) cancelAnimationFrame(raf)
      if (ro) ro.disconnect()
    }
  })
</script>

<div class="relative flex h-72 w-72 items-center justify-center">
  <canvas bind:this={canvas} class="pointer-events-none absolute inset-0"></canvas>

  <div class="relative z-10 flex flex-col items-center justify-center">
    <div class="text-center">
      <div
        class="animate-shimmer bg-gradient-to-r from-emerald-400 via-sky-400 to-fuchsia-400 bg-clip-text text-2xl font-extrabold text-transparent"
      >
        {message}
      </div>
      <div class="mt-2 text-sm text-base-content/70">Nice work. Keep it going.</div>
    </div>
  </div>
</div>

<style>
  @keyframes shimmer {
    0% {
      background-position: 0% 50%;
    }
    100% {
      background-position: 200% 50%;
    }
  }
  .animate-shimmer {
    background-size: 200% 100%;
    animation: shimmer 1400ms ease-out forwards;
  }
</style>
