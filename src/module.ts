import { fileURLToPath } from 'node:url'
import {
  defineNuxtModule,
  addPlugin,
  createResolver,
  addImportsDir,
  resolveModule,
  addServerHandler, addTemplate,
} from '@nuxt/kit'
import type { AppLoaderConfiguration, DcuplInitOptions } from '@dcupl/common'
import { defu } from 'defu'
import { runtimeDir } from '@nuxt/devtools/dist/dirs'

// Module options TypeScript interface definition
export interface DcuplModuleOptions extends DcuplInitOptions {
  loader: AppLoaderConfiguration.ProcessOptions
  reloadHook?: {
    secret: string
  }
  shouldUpdate?: () => Promise<boolean>
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

    const publicOptions = { ..._options }
    delete publicOptions.reloadHook

    const shouldUpdateContent = _options.shouldUpdate
      ? `export const customShouldUpdate = ${_options.shouldUpdate.toString()}`
      : `export const customShouldUpdate = () => false`

    addTemplate({
      filename: 'should-update.js',
      write: true,
      getContents: () => shouldUpdateContent,
    })

    publicOptions.customUpdateFunction = !!_options.shouldUpdate

    _nuxt.options.runtimeConfig.public.dcupl = defu(_nuxt.options.runtimeConfig.public.dcupl, publicOptions)
    _nuxt.options.runtimeConfig.dcupl = defu(_nuxt.options.runtimeConfig.dcupl, {
      reloadHook: _options.reloadHook,
    })

    if (_options.reloadHook && _options.reloadHook?.secret) {
      addServerHandler({
        route: '/api/reload-dcupl',
        handler: resolver.resolve('./runtime/server/api/reload-dcupl.get'),
      })
    }

    _nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.alias = nitroConfig.alias || {}
      nitroConfig.alias['#dcupl'] = resolveRuntimeModule('./server/services')
    })
  },
})
