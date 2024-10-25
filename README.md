<!--
Get your module up and running quickly.

Find and replace all on all files (CMD+SHIFT+F):
- Name: dcupl - Nuxt
- Package name: @nuxtjs/dcupl
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
npx nuxi module add @nuxtjs/dcupl
```

or using any package manager:

```bash
# Using pnpm
pnpm add @nuxtjs/dcupl

# Using yarn
yarn add @nuxtjs/dcupl

# Using npm
npm install @nuxtjs/dcupl
```

Add the module to your `nuxt.config.js`:

```js
export default {
  modules: [
    '@nuxtjs/dcupl'
  ],
  dcupl: {
    //Options
    config: {
      projectId: '<YOUR_PROJECT_ID>',
      apiKey: '<YOUR_API_KEY>',
    },
    reloadHook: { //or false to deactivate the api endpoint
      secret: '<YOUR_SECRET>'
    },
    shouldUpdate: async () => { //optional, default is the dcupl default implementation see: https://github.com/markus-gx/nuxt-dcupl/blob/main/src/dcupl/dcupl.instance.ts#L49
      //Here you can add custom functionality how to validate if the update should be applied
      //to the current instance. If you return false the update will be ignored.
      return true
    }
    // and all other init options provided by dcupl (https://docs.dcupl.com/docs/Introduction)
  }
}
```

## Usage

After setting up the module you can use the `dcupl` instance in your Nuxt application:

```vue
<script setup lang="ts">
  const dcupl = useDcupl()
  const articleList = dcupl.lists.create({ modelKey: 'Article' })
  articleList.catalog.query.applyOptions({ count: 10 })
  
  // get initial data
  articles.value = articleList.catalog.query.execute()
</script>
```

Or in an API Endpoint:

```ts
export default defineEventHandler(async (event) => {
  const dcupl = await useDcuplServerInstance(event)

  const articleList = dcupl.lists.create({ modelKey: 'Article' })
  articleList.catalog.query.applyOptions({ count: 10 })
  return articleList.catalog.query.execute()
})
```

## Reload dcupl Server Session

To reload the dcupl server session you can use the reload hook. This will trigger a reload of the dcupl server session and update the data in your application.
This module exposes and API Endpoint called `/api/reload-dcupl`. 
Pass an `Authorization` header with the secret you defined in the module options.

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
