<script>
  import { page } from '$app/state'
  import { onMount } from 'svelte'
  // @ts-ignore - Virtual icon import
  import GgMenu from 'virtual:icons/gg/menu'
  // @ts-ignore - Virtual icon import

  /**
   * @typedef {Object} Props
   * @property {boolean} [isUserLoggedIn]
   * @property {boolean} [menuOpen] - Sidebar open state
   * @property {() => void} [toggleMenu] - Function to toggle sidebar
   */

  /** @type {Props} */
  let { isUserLoggedIn = false, menuOpen = false, toggleMenu = () => {} } = $props()

  let theme = $state('light') // Default fallback

  // Sync with the theme that was already set in the layout
  onMount(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    theme = savedTheme
  })

  // Toggle between light and dark themes
  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }
</script>

<!-- Fixed Hamburger Button - Only Visible When Sidebar Closed -->
{#if !menuOpen}
  <button
    class="fixed left-4 top-4 z-[60] rounded-md bg-base-200 p-2 shadow-lg"
    onclick={() => toggleMenu()}
    aria-label="Open sidebar"
    title="Open sidebar"
  >
    <GgMenu />
  </button>
{/if}

<!-- Mobile Backdrop -->
{#if menuOpen}
  <div
    class="fixed inset-0 z-40 bg-black/50 lg:hidden"
    onclick={() => toggleMenu()}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Escape' && toggleMenu()}
  ></div>
{/if}

<!-- Sidebar Layout -->
<aside
  id="sidebar"
  class="fixed bottom-0 left-0 top-0 z-50 flex h-screen w-64 flex-col overflow-y-auto bg-base-100 shadow-lg transition-transform duration-300 ease-in-out {menuOpen
    ? 'translate-x-0'
    : '-translate-x-full'}"
>
  <div class="flex-grow">
    <!-- Menu Label with Close Button -->
    <div class="mb-4 flex items-center justify-between p-4">
      <div class="flex-1 text-center">
        {#if isUserLoggedIn}
          <h2 class="text-xl font-semibold">Life Metrics</h2>
        {:else}
          <h2 class="text-xl font-semibold">Menu</h2>
        {/if}
      </div>

      <!-- Close Button - Only Visible When Sidebar Open -->
      <button
        class="rounded-md bg-base-200 p-2 transition-colors hover:bg-base-300"
        onclick={() => toggleMenu()}
        title="Close sidebar"
        aria-label="Close sidebar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- Navigation Menu -->
    {#if isUserLoggedIn}
      <ul class="menu w-full rounded-box">
        <li>
          <a href="/app" class:active={page.url.pathname === '/app'}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Home
          </a>
        </li>
        <li>
          <a href="/app/journals" class:active={page.url.pathname === '/app/journals'}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
              />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 4v16" />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8h5M12 12h5M12 16h5"
              />
            </svg>
            Journals
          </a>
        </li>
        <li>
          <a href="/app/writings" class:active={page.url.pathname === '/app/writings'}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16.862 3.487a2.25 2.25 0 013.182 3.182L9.085 17.628 5.25 18.75l1.122-3.835L16.862 3.487z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-3-3"
              />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 21h14" />
            </svg>
            Writings
          </a>
        </li>
        <li>
          <a href="/app/finances" class:active={page.url.pathname === '/app/finances'}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18V10" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18V6" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 18V14" />
            </svg>
            Finances
          </a>
        </li>
        <li>
          <a href="/app/habits" class:active={page.url.pathname === '/app/habits'}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4"
              />
            </svg>
            Habits
          </a>
        </li>
        <li>
          <a href="/app/relationships" class:active={page.url.pathname === '/app/relationships'}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            Relationships
          </a>
        </li>
        <li>
          <a href="/app/health" class:active={page.url.pathname === '/app/health'}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v8M8 12h8"
              />
            </svg>
            Health
          </a>
        </li>
        <li>
          <a href="/app/settings" class:active={page.url.pathname === '/app/settings'}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="3" stroke-width="2" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v2" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19v2" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12h2" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 12h2" />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5.636 5.636l1.414 1.414"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M18.364 18.364l-1.414-1.414"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5.636 18.364l1.414-1.414"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M18.364 5.636l-1.414 1.414"
              />
            </svg>
            Settings
          </a>
        </li>
      </ul>
    {:else}
      <div class="p-4 text-center text-base-content/50">
        <p>Please log in to access the dashboard</p>
      </div>
    {/if}
  </div>

  <!-- Footer Section (Bottom Buttons) -->
  <div class="border-t border-base-300 p-4">
    <!-- Night Mode Toggle -->
    <button class="btn btn-outline btn-block" onclick={toggleTheme}>
      {#if theme === 'light'}
        🌙 Dark Mode
      {:else}
        ☀️ Light Mode
      {/if}
    </button>

    <!-- Login/Logout Button -->
    {#if isUserLoggedIn}
      <form method="post" action="/logout" class="mt-2">
        <button type="submit" class="btn btn-primary btn-block">Logout</button>
      </form>
    {:else}
      <a href="/login" class="btn btn-secondary btn-block mt-2">Log In</a>
    {/if}
  </div>
</aside>

<style>
  /* Add active class styles */
  a.active {
    background-color: var(--tw-bg-opacity, #374151); /* Tailwind dark gray */
    color: var(--tw-text-opacity, #fff); /* White text */
    border-radius: 0.5rem; /* Match DaisyUI button rounding */
  }
</style>
