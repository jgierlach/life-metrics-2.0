<script lang="ts">
  import '@fontsource/poppins/400.css'
  import '@fontsource/poppins/600.css'
  import '@fontsource/poppins/700.css'
  import '$lib/base.css'
  import Navbar from '$lib/components/Navbar.svelte'
  import Footer from '$lib/components/Footer.svelte'
  import { onMount } from 'svelte'
  import { invalidate } from '$app/navigation'
  import { page } from '$app/stores'

  let { data, children } = $props()

  let { supabase, session } = $derived(data)

  let brandId = $derived(session?.user?.email)

  // Sidebar state management - initialize based on screen size
  let menuOpen = $state(false)

  // Determine if we are on an app route (e.g., /app or any sub-route)
  let isAppRoute = $derived(($page.url.pathname || '/').startsWith('/app'))

  onMount(() => {
    // Set initial sidebar state based on screen size
    // Desktop: open by default, Mobile: closed by default
    menuOpen = window.innerWidth >= 1024

    const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
      if (newSession?.expires_at !== session?.expires_at) {
        invalidate('supabase:auth')
      }
    })

    return () => data.subscription.unsubscribe()
  })
</script>

<!-- Add this script tag to initialize theme before rendering -->
<svelte:head>
  <script>
    // Initialize theme immediately to prevent flash
    ;(function () {
      const savedTheme = localStorage.getItem('theme') || 'light'
      document.documentElement.setAttribute('data-theme', savedTheme)
    })()
  </script>
</svelte:head>

{#if isAppRoute}
  <!-- Application Layout for /app routes -->
  <div class="flex min-h-screen flex-col bg-base-200">
    <div class="flex flex-1">
      <Navbar
        isUserLoggedIn={Boolean(session?.user)}
        {menuOpen}
        toggleMenu={() => (menuOpen = !menuOpen)}
      />

      <!-- Main content area with conditional margin based on sidebar state -->
      <div
        class="flex-grow overflow-auto transition-all duration-300 ease-in-out {menuOpen
          ? 'lg:ml-64'
          : 'lg:ml-0'}"
      >
        <div class="min-h-screen p-4 {!menuOpen ? 'pt-16' : ''}">
          {@render children?.()}
        </div>

        <Footer />
      </div>
    </div>
  </div>
{:else}
  <!-- Public/Landing routes (e.g., /) render their own layout/styles -->
  {@render children?.()}
{/if}

<style global>
  body,
  html {
    margin: 0;
    padding: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .min-h-screen {
    min-height: 100vh;
  }

  .flex-grow {
    flex-grow: 1;
  }
</style>
