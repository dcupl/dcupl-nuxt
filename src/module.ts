import {
  defineNuxtModule,
  addPlugin,
  createResolver,
  addImportsDir,
  addServerHandler,
  addTemplate,
} from "@nuxt/kit";
import type { AppLoaderConfiguration, DcuplInitOptions } from "@dcupl/common";
import { defu } from "defu";

// Module options TypeScript interface definition
export interface DcuplModuleOptions extends DcuplInitOptions {
  loader: AppLoaderConfiguration.ProcessOptions;
  reloadHook?: {
    secret: string;
  };
  shouldUpdate?: () => Promise<boolean>;
  useCustomUpdateFunction?: boolean;
}

export default defineNuxtModule<DcuplModuleOptions>({
  meta: {
    name: "@dcupl/nuxt",
    configKey: "dcupl",
  },
  // Default configuration options of the Nuxt module
  defaults: {
    loader: {
      applicationKey: "default",
    },
  },
  setup(_options, _nuxt) {
    const { resolve } = createResolver(import.meta.url);

    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
    addPlugin(resolve("./runtime/plugin"));
    addImportsDir(resolve("./runtime/composables"));

    const publicOptions = { ..._options };
    delete publicOptions.reloadHook;

    const shouldUpdateContent = _options.shouldUpdate
      ? `export const customShouldUpdate = ${_options.shouldUpdate.toString()}`
      : `export const customShouldUpdate = async () => false`;

    addTemplate({
      filename: "should-update.js",
      write: true,
      getContents: () => shouldUpdateContent,
    });

    publicOptions.useCustomUpdateFunction = !!_options.shouldUpdate;

    _nuxt.options.runtimeConfig.public.dcupl = defu(
      _nuxt.options.runtimeConfig.public.dcupl,
      publicOptions
    );
    _nuxt.options.runtimeConfig.dcupl = defu(
      _nuxt.options.runtimeConfig.dcupl,
      {
        reloadHook: _options.reloadHook,
      }
    );

    if (_options.reloadHook && _options.reloadHook?.secret) {
      addServerHandler({
        route: "/api/reload-dcupl",
        handler: resolve("./runtime/server/api/reload-dcupl.get"),
      });
    }

    _nuxt.hook("nitro:config", (nitroConfig) => {
      nitroConfig.alias = nitroConfig.alias || {};
      nitroConfig.alias["#dcupl/server"] = resolve(
        __dirname,
        "./runtime/server/services"
      );
    });

    addTemplate({
      filename: "types/dcupl.d.ts",
      getContents: () =>
        [
          "declare module '#dcupl/server' {",
          `  const useDcuplServerInstance: typeof import('${resolve(
            "./runtime/server/services"
          )}').useDcuplServerInstance`,
          "}",
        ].join("\n"),
    });

    _nuxt.hook("prepare:types", async (options) => {
      options.references.push({
        path: resolve(_nuxt.options.buildDir, "types/dcupl.d.ts"),
      });
    });
  },
});
