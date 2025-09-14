<script>
  export let loading = false
</script>

{#if loading}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 bg-opacity-60 backdrop-blur-sm"
  >
    <div class="relative flex items-center justify-center">
      <!-- Outer breathing circle -->
      <div
        class="animate-breathe absolute h-32 w-32 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 opacity-40"
      ></div>

      <!-- Middle gentle wave -->
      <div
        class="animate-gentle-spin absolute h-20 w-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-200 opacity-60"
      ></div>

      <!-- Inner soft pulse -->
      <div
        class="animate-soft-pulse h-12 w-12 rounded-full bg-gradient-to-br from-rose-100 to-pink-200 opacity-80 shadow-lg shadow-pink-200/30"
      ></div>

      <!-- Floating gentle orbs -->
      <div class="animate-float-1 bg-lavender-200 absolute h-3 w-3 rounded-full opacity-50"></div>
      <div class="animate-float-2 bg-sage-200 absolute h-2 w-2 rounded-full opacity-60"></div>
      <div class="animate-float-3 bg-peach-200 absolute h-2.5 w-2.5 rounded-full opacity-55"></div>
    </div>

    <!-- Calm loading text -->
    <div class="absolute mt-40 text-center">
      <p class="animate-gentle-fade text-base font-light tracking-wide text-slate-600">
        Taking a moment...
      </p>
    </div>
  </div>
{/if}

<style>
  /* Breathing animation - like a slow, deep breath */
  @keyframes breathe {
    0%,
    100% {
      transform: scale(1);
      opacity: 0.3;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.6;
    }
  }

  /* Very gentle rotation */
  @keyframes gentle-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Soft pulsing like a heartbeat */
  @keyframes soft-pulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 0.7;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.9;
    }
  }

  /* Gentle floating movements */
  @keyframes float-1 {
    0%,
    100% {
      transform: translate(25px, -20px);
    }
    33% {
      transform: translate(-15px, 30px);
    }
    66% {
      transform: translate(35px, 15px);
    }
  }

  @keyframes float-2 {
    0%,
    100% {
      transform: translate(-30px, 25px);
    }
    50% {
      transform: translate(20px, -25px);
    }
  }

  @keyframes float-3 {
    0%,
    100% {
      transform: translate(15px, 30px);
    }
    25% {
      transform: translate(-25px, -10px);
    }
    75% {
      transform: translate(-5px, 25px);
    }
  }

  /* Gentle text fade */
  @keyframes gentle-fade {
    0%,
    100% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
  }

  .animate-breathe {
    animation: breathe 4s ease-in-out infinite;
  }

  .animate-gentle-spin {
    animation: gentle-spin 8s linear infinite;
  }

  .animate-soft-pulse {
    animation: soft-pulse 3s ease-in-out infinite;
  }

  .animate-float-1 {
    animation: float-1 12s ease-in-out infinite;
  }

  .animate-float-2 {
    animation: float-2 10s ease-in-out infinite;
  }

  .animate-float-3 {
    animation: float-3 14s ease-in-out infinite;
  }

  .animate-gentle-fade {
    animation: gentle-fade 3s ease-in-out infinite;
  }

  /* Custom pastel colors */
  .bg-lavender-200 {
    background-color: #e5e7ff;
  }

  .bg-sage-200 {
    background-color: #d1fae5;
  }

  .bg-peach-200 {
    background-color: #fed7d7;
  }
</style>
