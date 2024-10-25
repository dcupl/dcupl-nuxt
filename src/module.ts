import { defineNuxtModule, addPlugin, createResolver, addImportsDir, resolve, resolveModule } from '@nuxt/kit'
import type { AppLoaderConfiguration, DcuplInitOptions } from '@dcupl/common'
import { defu } from 'defu'
import { runtimeDir } from '@nuxt/devtools/dist/dirs'

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
    const resolveRuntimeModule = (path: string) => resolveModule(path, { paths: resolver.resolve('./runtime') })

    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
    addPlugin(resolver.resolve('./runtime/plugin'))
    addImportsDir(resolver.resolve(runtimeDir, 'composables'))
    _nuxt.options.runtimeConfig.public.dcupl = defu(_nuxt.options.runtimeConfig.public.dcupl, _options)

    _nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.alias = nitroConfig.alias || {}
      nitroConfig.alias['#dcupl'] = resolveRuntimeModule('./server/services')
    })
  },
})
