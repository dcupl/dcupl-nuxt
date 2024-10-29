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

dcupl - Nuxt is a powerful and easy-to-use Nuxt module that semlessly integrates [dcupl](https://dcupl.com) into your Nuxt application.

## Features

- ⛰ Fully Server Side Compatible (including Nitro API Routes)
- 🚠 Reload API Hook
- 🌲 Customizable update validation

## Quick Setup

Install the module to your Nuxt application with one command:

```bash
npx nuxi module add @dcupl/nuxt
```

or using any package manager:

```bash
# Using pnpm
pnpm add @dcupl/nuxt

# Using yarn
yarn add @dcupl/nuxt

# Using npm
npm install @dcupl/nuxt
```

Add the module to your `nuxt.config.js`:

### Simple Setup
Uses a the public `Product Catalog Starter` - [dcupl Console](https://console.dcupl.com)

```js
// https://nuxt.com/docs/api/configuration/nuxt-config
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

### Advanced Setup
```js
export default {
  modules: ["@dcupl/nuxt"],
  dcupl: {
    //Options
    config: {
      projectId: "<YOUR_PROJECT_ID>",
      apiKey: "<YOUR_API_KEY>",
    },
    loader: {
      applicationKey: "default", //default value
      //... loader options
    },
    reloadHook: {
      //or false to deactivate the api endpoint
      secret: "<YOUR_SECRET>",
    },
    shouldUpdate: async () => {
      //optional, default is the dcupl default implementation see: https://github.com/markus-gx/nuxt-dcupl/blob/main/src/dcupl/dcupl.instance.ts#L49
      //Here you can add custom functionality how to validate if the update should be applied
      //to the current instance. If you return false the update will be ignored.
      return true;
    },
    // and all other init options provided by dcupl (https://docs.dcupl.com/docs/Introduction)
  },
};
```

## Usage

After setting up the module you can use the `dcupl` instance in your Nuxt application:

### Main Catalog Page

```vue
<template>
  <div>
    <pre><code>{{ JSON.stringify(article, null, 2) }}</code></pre>
  </div>
</template>
<script setup lang="ts">
const articles = ref<any>([]);

const dcupl = useDcupl();

// create a new list. A DcuplList contains all your model data and persists the applied queries.
const articleList = dcupl.lists.create({ modelKey: "Article" });
articleList.catalog.query.applyOptions({ count: 10 });

// get initial data
articles.value = articleList.catalog.query.execute();

// listen for updates to the list and update the articles
articleList.on((msg) => {
  if (msg.action === "update") {
    articles.value = articleList.catalog.query.execute();
  }
});

onBeforeUnmount(() => {
  // cleanup on unmount
  articleList.destroy();
});
</script>
```

### Detail Page

```vue
<template>
  <div>
    <pre><code>{{ JSON.stringify(article, null, 2) }}</code></pre>
  </div>
</template>
<script setup lang="ts">
const { key } = useRoute().params;

const dcupl = useDcupl();

const article = dcupl.query.one({
  modelKey: "Article",
  itemKey: key as string,
  projection: {
    $: true,
    vendorId: {
      $: true, // also returns the details of the referenced vendor model
    },
  },
});
</script>
```

Or in an API Endpoint (`server/api/articles/[key].ts`):

```ts
import { useDcuplServerInstance } from "#dcupl/server";

export default defineEventHandler(async (event) => {
  const dcupl = await useDcuplServerInstance(event);

  return dcupl.query.execute({
    modelKey: "Article",
    count: 10,
    queries: [],
  });
});
```

## Reload dcupl Server Instance

To reload the dcupl server Instance you can use the reload hook. This will trigger a reload of the dcupl server session and update the data in your application.
This module exposes and API Endpoint called `/api/reload-dcupl`.
Pass an `Authorization` header or an token with the secret you defined in the module options.

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
  
  # Run Vitest
  npm run test
  npm run test:watch
  
  # Release new version
  npm run release
  ```

</details>

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@nuxtjs/dcupl/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/@nuxtjs/dcupl
[npm-downloads-src]: https://img.shields.io/npm/dm/@nuxtjs/dcupl.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/@nuxtjs/dcupl
[license-src]: https://img.shields.io/npm/l/@nuxtjs/dcupl.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/@nuxtjs/dcupl
[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
