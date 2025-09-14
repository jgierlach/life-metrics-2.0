<script>
  let { data } = $props();
</script>

<section class="container mx-auto mt-6">
  {#if data.session}
    <h1 class="text-center text-2xl font-bold">
      You are logged in as {data.session.user.email}. Go to
      <a href="/app" class="text-blue-500 underline">app</a>
    </h1>
  {:else}
    <h1 class="text-center text-2xl font-bold">
      You are not <a href="/login" class="text-blue-500 underline">Logged in</a>
    </h1>
  {/if}
</section>
