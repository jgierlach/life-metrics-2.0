# Fullstack Project Boilerplate

## Tech Stack

- [SvelteKit](https://kit.svelte.dev/)
- [Daisy UI](https://daisyui.com/)
- [Supabase](https://supabase.com/)

## Components, stores, base.css, and utils.js

For ease of reference using $lib/path shorthand the components and stores folders along with base.css and utils.js files are placed under the lib directory

## Environment variable instructions

Out of the box this project is configured to work with Supabase.com. Create a .env at the root of this project and create the following environment variables

PUBLIC_SUPABASE_URL='Your project's supabase url'

PUBLIC_SUPABASE_ANON_KEY='Your project's supabase anon key'

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
