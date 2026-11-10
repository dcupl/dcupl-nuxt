import { DcuplInstance } from "./dcupl/dcupl.instance";
import type { DcuplModuleOptions } from "../module";
import type {} from "./server/utils/request-scope";
import { defineNuxtPlugin, useRequestEvent, useRuntimeConfig } from "#app";

export default defineNuxtPlugin(async (nuxtApp) => {
  const dcuplConfig = useRuntimeConfig().public.dcupl as DcuplModuleOptions;

  if (import.meta.server) {
    // the Nitro side owns the instance, so SSR and API routes share it
    const scope = useRequestEvent()?.context._dcuplScope;
    if (!scope) {
      throw new Error("[dcupl] the server instance is not available on this request");
    }
    const dcupl = await scope.get();
    // destroy only the lists this request created
    nuxtApp.hook("app:rendered", () => scope.destroyLists());
    return {
      provide: { dcupl, dcuplSession: undefined as DcuplInstance | undefined },
    };
  }

  const sessionDcuplInstance = new DcuplInstance("session", dcuplConfig);
  await sessionDcuplInstance.init();
  return {
    provide: {
      dcupl: sessionDcuplInstance.dcupl,
      dcuplSession: sessionDcuplInstance as DcuplInstance | undefined,
    },
  };
});
