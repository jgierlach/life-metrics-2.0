<script>
  import { fade } from 'svelte/transition'
  export let visible = false
  export let message = 'Saved!'
  export let subtext = 'Nice work. Keep it going.'
</script>

{#if visible}
  <div
    class="celebration-overlay"
    role="img"
    aria-label="Success"
    transition:fade={{ duration: 450 }}
  >
    {#each Array(60) as _, i}
      <div
        class="confetti confetti-{i % 5}"
        style="
          left: {Math.random() * 100}%;
          animation-delay: {Math.random() * 1.2}s;
          animation-duration: {1.8 + Math.random() * 0.8}s;
        "
      ></div>
    {/each}

    <div class="celebration-icon">
      <div class="success-checkmark">
        <div class="check-icon">
          <span class="icon-line line-tip"></span>
          <span class="icon-line line-long"></span>
          <div class="icon-circle"></div>
        </div>
      </div>
      <div class="celebration-text">
        <h3>{message}</h3>
        <p>{subtext}</p>
      </div>
    </div>

    {#each Array(18) as _, i}
      <div
        class="sparkle sparkle-{i % 3}"
        style="
          left: {Math.random() * 100}%;
          top: {Math.random() * 100}%;
          animation-delay: {Math.random() * 2.5}s;
        "
      >
        ✨
      </div>
    {/each}
  </div>
{/if}

<style>
  .celebration-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(2px);
    animation: overlayFadeIn 200ms ease-out;
  }

  .celebration-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    animation:
      celebrationBounce 800ms ease-out,
      fadeOutSoft 400ms ease-in 1600ms both;
  }

  .celebration-text {
    margin-top: 0.75rem;
    animation: fadeInUp 800ms ease-out 250ms both;
  }

  .celebration-text h3 {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--fallback-su, #22c55e);
    margin: 0;
    text-shadow: 0 0 10px color-mix(in oklab, var(--fallback-su, #22c55e) 50%, transparent);
  }

  .celebration-text p {
    font-size: 1rem;
    color: color-mix(in oklab, var(--fallback-bc, #e5e7eb) 90%, transparent);
    margin: 0.35rem 0 0 0;
  }

  .success-checkmark {
    width: 88px;
    height: 88px;
    margin: 0 auto;
  }
  .check-icon {
    width: 88px;
    height: 88px;
    position: relative;
    border-radius: 50%;
    box-sizing: border-box;
    border: 4px solid var(--fallback-su, #22c55e);
    background: color-mix(in oklab, var(--fallback-su, #22c55e) 12%, transparent);
    box-shadow: 0 0 18px color-mix(in oklab, var(--fallback-su, #22c55e) 30%, transparent);
  }

  .icon-line {
    height: 6px;
    background-color: var(--fallback-su, #22c55e);
    display: block;
    border-radius: 2px;
    position: absolute;
    z-index: 10;
    box-shadow: 0 0 6px color-mix(in oklab, var(--fallback-su, #22c55e) 60%, transparent);
  }
  .icon-line.line-tip {
    top: 52px;
    left: 16px;
    width: 28px;
    transform: rotate(45deg);
    animation: checkmarkIcon 250ms ease-in-out 550ms both;
  }
  .icon-line.line-long {
    top: 42px;
    right: 10px;
    width: 50px;
    transform: rotate(-45deg);
    animation: checkmarkIcon 250ms ease-in-out 650ms both;
  }

  .icon-circle {
    top: -4px;
    left: -4px;
    z-index: 5;
    width: 88px;
    height: 88px;
    border-radius: 50%;
    position: absolute;
    box-sizing: border-box;
    border: 4px solid color-mix(in oklab, var(--fallback-su, #22c55e) 35%, transparent);
    animation: checkmarkCircle 600ms ease-in-out;
  }

  .confetti {
    position: absolute;
    width: 10px;
    height: 10px;
    background: #f39c12;
    animation: confettiFall linear infinite;
  }
  .confetti-0 {
    background: #e74c3c;
  }
  .confetti-1 {
    background: #f39c12;
  }
  .confetti-2 {
    background: #2ecc71;
  }
  .confetti-3 {
    background: #3498db;
  }
  .confetti-4 {
    background: #9b59b6;
  }
  .confetti::before {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    background: inherit;
    top: -5px;
    transform: rotate(45deg);
  }

  .sparkle {
    position: absolute;
    font-size: 1.25rem;
    animation: sparkleFloat 3s ease-in-out infinite;
    pointer-events: none;
  }
  .sparkle-0 {
    animation-duration: 2.4s;
  }
  .sparkle-1 {
    animation-duration: 2.9s;
  }
  .sparkle-2 {
    animation-duration: 3.4s;
  }

  @keyframes celebrationBounce {
    0% {
      transform: translate(-50%, -50%) scale(0) rotate(180deg);
    }
    50% {
      transform: translate(-50%, -50%) scale(1.15) rotate(0);
    }
    100% {
      transform: translate(-50%, -50%) scale(1) rotate(0);
    }
  }
  @keyframes fadeInUp {
    0% {
      opacity: 0;
      transform: translateY(24px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes checkmarkIcon {
    0% {
      transform: scale(0) rotate(45deg);
    }
    50% {
      transform: scale(1.15) rotate(45deg);
    }
    100% {
      transform: scale(1) rotate(45deg);
    }
  }
  @keyframes checkmarkCircle {
    0% {
      border-color: transparent;
      border-top-color: var(--fallback-su, #22c55e);
      transform: rotate(0deg);
    }
    25% {
      border-color: transparent;
      border-top-color: var(--fallback-su, #22c55e);
      border-right-color: var(--fallback-su, #22c55e);
      transform: rotate(90deg);
    }
    50% {
      border-color: transparent;
      border-top-color: var(--fallback-su, #22c55e);
      border-right-color: var(--fallback-su, #22c55e);
      border-bottom-color: var(--fallback-su, #22c55e);
      transform: rotate(180deg);
    }
    75% {
      border-color: transparent;
      border-top-color: var(--fallback-su, #22c55e);
      border-right-color: var(--fallback-su, #22c55e);
      border-bottom-color: var(--fallback-su, #22c55e);
      border-left-color: var(--fallback-su, #22c55e);
      transform: rotate(270deg);
    }
    100% {
      border-color: var(--fallback-su, #22c55e);
      transform: rotate(360deg);
    }
  }
  @keyframes overlayFadeIn {
    0% {
      opacity: 0;
      backdrop-filter: blur(0px);
    }
    100% {
      opacity: 1;
      backdrop-filter: blur(2px);
    }
  }
  @keyframes confettiFall {
    0% {
      transform: translateY(-100vh) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(100vh) rotate(720deg);
      opacity: 0;
    }
  }
  @keyframes sparkleFloat {
    0%,
    100% {
      transform: translateY(0px) rotate(0deg) scale(1);
      opacity: 0.7;
    }
    33% {
      transform: translateY(-18px) rotate(120deg) scale(1.2);
      opacity: 1;
    }
    66% {
      transform: translateY(9px) rotate(240deg) scale(0.85);
      opacity: 0.85;
    }
  }

  @keyframes fadeOutSoft {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
</style>
