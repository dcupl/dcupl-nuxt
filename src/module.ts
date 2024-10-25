import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit'
import type { AppLoaderConfiguration, DcuplInitOptions } from '@dcupl/common'
import { defu } from 'defu'

// Module options TypeScript interface definition
export interface DcuplModuleOptions extends DcuplInitOptions {
  loader: AppLoaderConfiguration.ProcessOptions
}

export default defineNuxtModule<DcuplModuleOptions>({
  meta: {
    name: '@nuxtjs/dcupl',
    configKey: 'dcupl',
  },
  // Default configuration options of the Nuxt module
  defaults: {
    loader: {
      applicationKey: 'default',
    },
  },
  setup(_options, _nuxt) {
    const resolver = createResolver(import.meta.url)

    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
    addPlugin(resolver.resolve('./runtime/plugin'))
    _nuxt.options.runtimeConfig.public.dcupl = defu(_nuxt.options.runtimeConfig.public.dcupl, _options)
  },
})
