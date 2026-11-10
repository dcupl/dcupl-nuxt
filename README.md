<!--
Get your module up and running quickly.

Find and replace all on all files (CMD+SHIFT+F):
- Name: dcupl - Nuxt
- Package name: @dcupl/nuxt
- Description: My new Nuxt module
-->

# dcupl - Nuxt

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

`@dcupl/nuxt` integrates [dcupl](https://dcupl.com) into a Nuxt application: it loads your dcupl Console project once per server process for SSR and Nitro API routes, and once in the browser after hydration.

## Features

- ⛰ Server-side rendering and Nitro API routes share one dcupl instance per server process
- 🔁 Background update checks (at most once a minute by default) and a reload API hook
- 🧹 Lists created during a server request are cleaned up after that request, never those of other requests
- 🌲 Customizable update validation

## Requirements

- Nuxt 4 (`nuxt` ^4.0), Node.js 22.22.3+, 24.15+ or 26+ (what Nuxt 4.6 requires: `^22.22.3 || ^24.15.0 || >=26.0.0`)
- dcupl SDK 2.1 (`@dcupl/core`, `@dcupl/common`, `@dcupl/loader` ^2.1.0, installed with the module)
- TypeScript 5.4 or later if you type-check (the SDK types use `NoInfer`)

Coming from SDK 1.x? See the [SDK migration guide](https://docs.dcupl.com/sdk/guides/migration). Coming from `@dcupl/nuxt` 0.0.x? See the [CHANGELOG](./CHANGELOG.md#v010).

## Quick Setup

```bash
npx nuxi module add @dcupl/nuxt
# or
npm install @dcupl/nuxt
```

Add the module to your `nuxt.config.ts`. This example uses the public `Product Catalog Starter` project of the [dcupl Console](https://console.dcupl.com):

```ts
export default defineNuxtConfig({
  modules: ["@dcupl/nuxt"],
  dcupl: {
    config: {
      projectId: "PP7ECntN4AI5Zfn5vEou",
      apiKey: "e0aa9e13-8f82-4edb-a5f3-3cf0c9e40207",
    },
  },
});
```

## Options

```ts
export default defineNuxtConfig({
  modules: ["@dcupl/nuxt"],
  dcupl: {
    // any dcupl init option (https://docs.dcupl.com/sdk/api/dcupl#dcuplinitoptions)
    config: {
      projectId: "<YOUR_PROJECT_ID>",
      apiKey: "<YOUR_API_KEY>",
    },
    // passed to DcuplAppLoader.process()
    loader: {
      applicationKey: "default", // default
    },
    // enables GET /api/reload-dcupl, see below
    reloadHook: {
      secret: "<YOUR_SECRET>",
    },
    // minimum time between two update checks on the server, in ms (default 60000);
    // false disables them (the reload hook still works)
    updateCheckInterval: 60_000,
    // optional: replaces the built-in update check, return true to rebuild
    shouldUpdate: async () => {
      return false;
    },
  },
});
```

| Option | Runtime config | Notes |
| --- | --- | --- |
| dcupl init options (`config`, …), `loader` | `runtimeConfig.public.dcupl` | Public: the browser builds its own instance with them. |
| `reloadHook.secret` | `runtimeConfig.dcupl.reloadHook` | Server only; override with `NUXT_DCUPL_RELOAD_HOOK_SECRET`. |
| `updateCheckInterval` | `runtimeConfig.dcupl.updateCheckInterval` | Server only; override with `NUXT_DCUPL_UPDATE_CHECK_INTERVAL`. |
| `shouldUpdate` | build time | Serialized with `toString()` into a server template, so it must not use variables from outside the function. |

## How it works

**Server.** The first request that needs dcupl builds the instance (fetches the app loader configuration of your Console project, processes it, runs `dcupl.init()`); concurrent first requests wait for the same build. All later requests, SSR pages and API routes alike, use that instance. `useDcupl()` and `useDcuplServerInstance(event)` return it wrapped for the request: lists you create through it are destroyed after the request (SSR: once the page has rendered; also when the request fails or the client aborts), and `lists.destroy()` without options only destroys the lists of this request. Take the instance before the response is sent: afterwards `useDcuplServerInstance(event)` rejects.

**Update checks.** At most once per `updateCheckInterval`, a request starts a background check without waiting for it. The built-in check asks the dcupl API whether the Console project changed (`changedAt` of the draft version; it covers files served from the dcupl CDN only, and it is skipped without a `projectId`). If it changed, a new instance is built completely and then swapped in; requests keep the previous instance until then, and the previous instance is destroyed once the last request using it has finished. A failed build keeps the current instance and is tried again at the next check.

**Browser.** After hydration the module builds a separate instance in the browser (`useDcupl()` returns it), so filtering and paging run client-side. Destroy lists you create in components when they unmount.

## Usage

### List page

```vue
<script setup lang="ts">
const dcupl = useDcupl();

// a DcuplList holds your model data and keeps the applied queries
const articleList = dcupl.lists.create({ modelKey: "Article" });
articleList.catalog.query.applyOptions({ count: 10 });

const articles = ref(articleList.catalog.query.items());

// follow the list when filters or paging change
const stopFollowing = articleList.onResultChange(() => {
  articles.value = articleList.catalog.query.items();
});

// on the server the module destroys the list after the request
onBeforeUnmount(() => {
  stopFollowing();
  articleList.destroy();
});
</script>
```

### Detail page

```vue
<script setup lang="ts">
const { key } = useRoute().params;
const dcupl = useDcupl();

const article = dcupl.query.one({
  modelKey: "Article",
  itemKey: key as string,
  projection: {
    $: true,
    vendorId: { $: true }, // also returns the referenced vendor
  },
});
</script>
```

### API route (`server/api/articles/[key].ts`)

```ts
import { useDcuplServerInstance } from "#dcupl/server";

export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, "key");
  const dcupl = await useDcuplServerInstance(event);

  const article = key ? dcupl.query.one({ modelKey: "Article", itemKey: key }) : undefined;
  if (!article) {
    throw createError({ statusCode: 404, statusMessage: "Article not found" });
  }
  return article;
});
```

## Reload hook

With `reloadHook.secret` set, the module adds `GET /api/reload-dcupl`. Call it with the secret as `Authorization` header or `?token=` query parameter, for example from a webhook after you published in the Console. It builds a new instance and swaps it in for SSR and API routes alike; it answers `200` once the new instance is live, `401` for a wrong secret and `500` when the build failed (the current instance stays).

```bash
curl -H "Authorization: <YOUR_SECRET>" https://your-app.example/api/reload-dcupl
```

## Contribution

<details>
  <summary>Local development</summary>
  
  ```bash
  # Install dependencies
  npm install
  
  # Generate type stubs
  npm run dev:prepare
  
  # Develop with the playground
  npm run dev
  
  # Build the playground
  npm run dev:build
  
  # Run ESLint
  npm run lint
  
  # Run Vitest (unit tests and an e2e fixture that needs no network)
  npm run test
  npm run test:watch

  # Type-check the module and the playground
  npm run test:types
  
  # Release: set the version in package.json and write the CHANGELOG section
  # by hand first; this lints, tests, builds and publishes that version as is
  npm run release
  git tag v$(node -p "require('./package.json').version") && git push --tags
  ```

</details>

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@dcupl/nuxt/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://www.npmjs.com/package/@dcupl/nuxt
[npm-downloads-src]: https://img.shields.io/npm/dm/@dcupl/nuxt.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/@dcupl/nuxt
[license-src]: https://img.shields.io/npm/l/@dcupl/nuxt.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/@dcupl/nuxt
[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
