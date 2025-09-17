<script>
  let { data } = $props()
</script>

<section class="font-sans">
  <!-- Navigation -->
  <div class="navbar sticky top-0 z-50 bg-base-100 shadow-sm">
    <div class="navbar-start">
      <div class="dropdown">
        <button type="button" aria-label="Open menu" class="btn btn-ghost lg:hidden">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h8m-8 6h16"
            ></path>
          </svg>
        </button>
        <ul
          class="menu dropdown-content menu-sm z-[1] mt-3 w-52 rounded-box bg-base-100 p-2 shadow"
        >
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">How It Works</a></li>
        </ul>
      </div>
      <button class="text-primary btn btn-ghost text-xl font-bold">Life Metrics</button>
    </div>
    <div class="navbar-center hidden lg:flex">
      <ul class="menu menu-horizontal px-1">
        <li><a href="#features" class="hover:text-primary">Features</a></li>
        <li><a href="#how-it-works" class="hover:text-primary">How It Works</a></li>
      </ul>
    </div>
    <div class="navbar-end">
      <a href="/login" class="btn btn-ghost mr-2">Sign In</a>
      <a href="/signup" class="btn btn-primary">Get Started</a>
    </div>
  </div>

  <!-- Hero Section -->
  <div class="from-primary/10 to-secondary/10 hero min-h-[70vh] bg-green-50">
    <div class="hero-content text-center">
      <div class="max-w-4xl">
        {#if data.session}
          <div class="mb-8 flex justify-center">
            <div
              role="status"
              class="alert alert-success max-w-3xl rounded-xl border border-success/20 bg-base-100 shadow-md"
            >
              <svg
                class="h-6 w-6 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m-8 8a9 9 0 110-18 9 9 0 010 18"
                ></path>
              </svg>
              <div>
                <h3 class="font-semibold text-neutral">Welcome back</h3>
                <p class="text-sm text-neutral/60">
                  Signed in as
                  <span class="font-medium text-neutral">{data.session.user.email}</span>
                </p>
              </div>
              <div class="ml-auto">
                <a href="/app" class="btn btn-success btn-sm">Open App</a>
              </div>
            </div>
          </div>
        {/if}
        <h1 class="mb-6 text-balance text-5xl font-bold text-neutral lg:text-7xl">
          Transform Your Life with
          <span class="text-primary">Data-Driven</span> Insights
        </h1>
        <p class="mx-auto mb-8 max-w-3xl text-pretty text-xl text-neutral/80 lg:text-2xl">
          Monitor your health, finances, relationships, and habits effortlessly. Life Metrics
          empowers you to track what matters most and make informed decisions for a better life.
        </p>
        <div class="flex flex-col justify-center gap-4 sm:flex-row">
          <button class="btn btn-primary btn-lg">Start Free Trial</button>
          <button class="btn btn-outline btn-lg">Watch Demo</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Features Section -->
  <section id="features" class="bg-base-100 py-20">
    <div class="container mx-auto px-4">
      <div class="mb-16 text-center">
        <h2 class="mb-4 text-4xl font-bold text-neutral lg:text-5xl">
          Everything You Need to Track
        </h2>
        <p class="mx-auto max-w-2xl text-xl text-neutral/70">
          Comprehensive life tracking tools designed to help you understand and improve every aspect
          of your life.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        <!-- Health & Biometrics -->
        <div class="card bg-base-200 shadow-lg transition-shadow hover:shadow-xl">
          <div class="card-div">
            <div class="bg-primary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <svg
                class="text-primary h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                ></path>
              </svg>
            </div>
            <h3 class="card-title text-neutral">Health & Biometrics</h3>
            <p class="text-neutral/70">
              Track heart rate, HRV, sleep quality, steps, calories burned, and more. Connect with
              your favorite fitness devices.
            </p>
            <div class="card-actions justify-end">
              <button class="btn btn-primary btn-sm">Learn More</button>
            </div>
          </div>
        </div>

        <!-- Financial Tracking -->
        <div class="card bg-base-200 shadow-lg transition-shadow hover:shadow-xl">
          <div class="card-body">
            <div
              class="bg-secondary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            >
              <svg
                class="text-secondary h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                ></path>
              </svg>
            </div>
            <h3 class="card-title text-neutral">Financial Insights</h3>
            <p class="text-neutral/70">
              Monitor spending patterns, savings goals, investment performance, and budget adherence
              with detailed analytics.
            </p>
            <div class="card-actions justify-end">
              <button class="btn btn-primary btn-sm">Learn More</button>
            </div>
          </div>
        </div>

        <!-- Relationships -->
        <div class="card bg-base-200 shadow-lg transition-shadow hover:shadow-xl">
          <div class="card-body">
            <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <svg
                class="h-8 w-8 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                ></path>
              </svg>
            </div>
            <h3 class="card-title text-neutral">Relationship Tracking</h3>
            <p class="text-neutral/70">
              Remember birthdays, anniversaries, and track communication frequency with friends and
              family.
            </p>
            <div class="card-actions justify-end">
              <button class="btn btn-primary btn-sm">Learn More</button>
            </div>
          </div>
        </div>

        <!-- Habit Tracking -->
        <div class="card bg-base-200 shadow-lg transition-shadow hover:shadow-xl">
          <div class="card-body">
            <div class="bg-primary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <svg
                class="text-primary h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <h3 class="card-title text-neutral">Habit Formation</h3>
            <p class="text-neutral/70">
              Build and maintain positive habits with streak tracking, reminders, and progress
              visualization.
            </p>
            <div class="card-actions justify-end">
              <button class="btn btn-primary btn-sm">Learn More</button>
            </div>
          </div>
        </div>

        <!-- Journaling -->
        <div class="card bg-base-200 shadow-lg transition-shadow hover:shadow-xl">
          <div class="card-body">
            <div
              class="bg-secondary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            >
              <svg
                class="text-secondary h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                ></path>
              </svg>
            </div>
            <h3 class="card-title text-neutral">Digital Journal</h3>
            <p class="text-neutral/70">
              Reflect on your day with guided prompts, mood tracking, and secure cloud storage for
              your thoughts.
            </p>
            <div class="card-actions justify-end">
              <button class="btn btn-primary btn-sm">Learn More</button>
            </div>
          </div>
        </div>

        <!-- Writing Tools -->
        <div class="card bg-base-200 shadow-lg transition-shadow hover:shadow-xl">
          <div class="card-body">
            <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <svg
                class="h-8 w-8 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
            </div>
            <h3 class="card-title text-neutral">Long-form Writing</h3>
            <p class="text-neutral/70">
              Powerful text editor for essays, stories, and detailed reflections with formatting and
              organization tools.
            </p>
            <div class="card-actions justify-end">
              <button class="btn btn-primary btn-sm">Learn More</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- How It Works Section -->
  <section id="how-it-works" class="bg-base-200 py-20">
    <div class="container mx-auto px-4">
      <div class="mb-16 text-center">
        <h2 class="mb-4 text-4xl font-bold text-neutral lg:text-5xl">How Life Metrics Works</h2>
        <p class="mx-auto max-w-2xl text-xl text-neutral/70">
          Simple steps to start tracking and improving your life metrics today.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div class="text-center">
          <div
            class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent"
          >
            <span class="text-2xl font-bold text-white">1</span>
          </div>
          <h3 class="mb-4 text-2xl font-bold text-neutral">Connect Your Data</h3>
          <p class="text-neutral/70">
            Link your fitness trackers, bank accounts, and other data sources securely.
          </p>
        </div>

        <div class="text-center">
          <div
            class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent"
          >
            <span class="text-2xl font-bold text-white">2</span>
          </div>
          <h3 class="mb-4 text-2xl font-bold text-neutral">Track & Record</h3>
          <p class="text-neutral/70">
            Automatically capture metrics or manually log important life events and habits.
          </p>
        </div>

        <div class="text-center">
          <div
            class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent"
          >
            <span class="text-2xl font-bold text-white">3</span>
          </div>
          <h3 class="mb-4 text-2xl font-bold text-neutral">Gain Insights</h3>
          <p class="text-neutral/70">
            Discover patterns, trends, and actionable insights to improve your life.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Dashboard Preview -->
  <section class="bg-base-100 py-20">
    <div class="container mx-auto px-4">
      <div class="mb-16 text-center">
        <h2 class="mb-4 text-4xl font-bold text-neutral lg:text-5xl">Your Personal Dashboard</h2>
        <p class="mx-auto max-w-2xl text-xl text-neutral/70">
          Get a comprehensive view of all your life metrics in one beautiful, intuitive interface.
        </p>
      </div>

      <div class="mockup-browser mx-auto max-w-4xl border bg-base-300">
        <div class="mockup-browser-toolbar">
          <div class="input">https://lifemetrics.app/dashboard</div>
        </div>
        <div class="flex justify-center bg-base-200 px-4 py-16">
          <div class="grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div class="stat rounded-lg bg-base-100 shadow">
              <div class="stat-title">Steps Today</div>
              <div class="text-primary stat-value">8,547</div>
              <div class="stat-desc">↗︎ 12% from yesterday</div>
            </div>
            <div class="stat rounded-lg bg-base-100 shadow">
              <div class="stat-title">Sleep Score</div>
              <div class="text-secondary stat-value">87</div>
              <div class="stat-desc">↗︎ 5 points this week</div>
            </div>
            <div class="stat rounded-lg bg-base-100 shadow">
              <div class="stat-title">Savings Rate</div>
              <div class="stat-value text-accent">23%</div>
              <div class="stat-desc">↗︎ On track for goals</div>
            </div>
            <div class="stat rounded-lg bg-base-100 shadow">
              <div class="stat-title">Habit Streak</div>
              <div class="text-primary stat-value">14</div>
              <div class="stat-desc">Days meditation</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Testimonials -->
  <section class="bg-base-200 py-20">
    <div class="container mx-auto px-4">
      <div class="mb-16 text-center">
        <h2 class="mb-4 text-4xl font-bold text-neutral lg:text-5xl">What Our Users Say</h2>
      </div>

      <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div class="card bg-base-100 shadow-lg">
          <div class="card-body">
            <div class="rating rating-sm mb-4">
              <input type="radio" name="rating-1" class="mask mask-star-2 bg-orange-400" />
              <input type="radio" name="rating-1" class="mask mask-star-2 bg-orange-400" />
              <input type="radio" name="rating-1" class="mask mask-star-2 bg-orange-400" />
              <input type="radio" name="rating-1" class="mask mask-star-2 bg-orange-400" />
              <input type="radio" name="rating-1" class="mask mask-star-2 bg-orange-400" checked />
            </div>
            <p class="mb-4 text-neutral/80">
              "Life Metrics helped me identify patterns in my sleep and productivity that I never
              noticed before. I've improved my daily routine significantly!"
            </p>
            <div class="flex items-center">
              <div class="avatar">
                <div class="bg-primary/10 flex w-12 items-center justify-center rounded-full">
                  <span class="text-primary font-bold">SM</span>
                </div>
              </div>
              <div class="ml-4">
                <div class="font-bold text-neutral">Sarah Martinez</div>
                <div class="text-sm text-neutral/60">Product Manager</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-lg">
          <div class="card-body">
            <div class="rating rating-sm mb-4">
              <input type="radio" name="rating-2" class="mask mask-star-2 bg-orange-400" />
              <input type="radio" name="rating-2" class="mask mask-star-2 bg-orange-400" />
              <input type="radio" name="rating-2" class="mask mask-star-2 bg-orange-400" />
              <input type="radio" name="rating-2" class="mask mask-star-2 bg-orange-400" />
              <input type="radio" name="rating-2" class="mask mask-star-2 bg-orange-400" checked />
            </div>
            <p class="mb-4 text-neutral/80">
              "The relationship tracking feature is amazing. I never forget important dates anymore,
              and I can see how my social connections impact my mood."
            </p>
            <div class="flex items-center">
              <div class="avatar">
                <div class="bg-secondary/10 flex w-12 items-center justify-center rounded-full">
                  <span class="text-secondary font-bold">DJ</span>
                </div>
              </div>
              <div class="ml-4">
                <div class="font-bold text-neutral">David Johnson</div>
                <div class="text-sm text-neutral/60">Entrepreneur</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-lg">
          <div class="card-body">
            <div class="rating rating-sm mb-4">
              <input type="radio" name="rating-3" class="mask mask-star-2 bg-orange-400" />
              <input type="radio" name="rating-3" class="mask mask-star-2 bg-orange-400" />
              <input type="radio" name="rating-3" class="mask mask-star-2 bg-orange-400" />
              <input type="radio" name="rating-3" class="mask mask-star-2 bg-orange-400" />
              <input type="radio" name="rating-3" class="mask mask-star-2 bg-orange-400" checked />
            </div>
            <p class="mb-4 text-neutral/80">
              "Finally, a tool that brings all my life data together. The insights have helped me
              make better financial decisions and improve my health habits."
            </p>
            <div class="flex items-center">
              <div class="avatar">
                <div class="flex w-12 items-center justify-center rounded-full bg-accent/10">
                  <span class="font-bold text-accent">EC</span>
                </div>
              </div>
              <div class="ml-4">
                <div class="font-bold text-neutral">Emily Chen</div>
                <div class="text-sm text-neutral/60">Data Scientist</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="from-primary to-secondary bg-green-700 py-20">
    <div class="container mx-auto px-4 text-center">
      <h2 class="mb-6 text-4xl font-bold text-white lg:text-5xl">Ready to Transform Your Life?</h2>
      <p class="mx-auto mb-8 max-w-2xl text-xl text-white/90">
        Join thousands of users who are already making data-driven decisions to improve their lives.
      </p>
      <div class="flex flex-col justify-center gap-4 sm:flex-row">
        <button class="text-primary btn btn-lg border-none hover:bg-base-200"
          >Start Free Trial</button
        >
        <button
          class="hover:text-primary btn btn-outline btn-lg border-white text-white hover:bg-white"
          >Schedule Demo</button
        >
      </div>
      <p class="mt-4 text-white/70">No credit card required • 14-day free trial</p>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer footer-center bg-base-200 p-10 text-base-content">
    <nav class="grid grid-flow-col gap-4">
      <a class="link-hover link">About us</a>
      <a class="link-hover link">Contact</a>
      <a class="link-hover link">Privacy Policy</a>
      <a class="link-hover link">Terms of Service</a>
    </nav>
    <aside>
      <p class="text-primary text-lg font-bold">Life Metrics</p>
      <p class="text-neutral/70">Transform your life with data-driven insights</p>
      <p class="text-neutral/60">Copyright © {new Date().getFullYear()} - All rights reserved</p>
    </aside>
  </footer>
</section>
