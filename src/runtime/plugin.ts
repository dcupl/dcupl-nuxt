import { DcuplInstance } from "./dcupl/dcupl.instance";
import type { DcuplModuleOptions } from "../module";
import { createRequestScope } from "./server/utils/request-scope";
import { customShouldUpdate } from "#build/should-update";
import { defineNuxtPlugin, useRequestEvent, useRuntimeConfig } from "#app";

let status: "initial_load" | "idle" | "updating" = "initial_load";
const serverDcuplInstance = new DcuplInstance("server");

const initializeOrUpdateServerClient = async (dcupl: DcuplModuleOptions) => {
  const shouldUpdate = await serverDcuplInstance.shouldUpdate();
  if (shouldUpdate) {
    if (status === "initial_load") {
      // console.log('initial load')
      // for the initial load we have to wait for the server instance to be initialized
      await serverDcuplInstance.init(dcupl, customShouldUpdate);
      status = "idle";
    } else if (status === "idle") {
      // when the server instance is idle we can update it without waiting - serving the old version until the new one is ready
      // console.log('updating')
      status = "updating";
      serverDcuplInstance.init(dcupl, customShouldUpdate);
      status = "idle";
    }
  }
};

export default defineNuxtPlugin(async (_nuxtApp) => {
  const { dcupl: dcuplConfig } = useRuntimeConfig().public;
  const sessionDcuplInstance = new DcuplInstance("session", dcuplConfig);
  let requestDcupl = serverDcuplInstance.dcupl;
  if (import.meta.server) {
    await initializeOrUpdateServerClient(dcuplConfig);
    const dcupl = serverDcuplInstance.dcupl;
    const event = useRequestEvent();
    if (event) {
      event.context._dcupl = dcupl;
    }
    // the instance is shared by concurrent requests: track the lists this
    // request creates and destroy only those once it has rendered
    const scope = createRequestScope(async () => ({
      dcupl,
      release: () => undefined,
    }));
    requestDcupl = await scope.get();
    _nuxtApp.hook("app:rendered", () => scope.destroyLists());
  } else {
    await sessionDcuplInstance.init(dcuplConfig);
  }

  return {
    provide: {
      dcupl: import.meta.server
        ? requestDcupl
        : sessionDcuplInstance.dcupl,
      dcuplSession: sessionDcuplInstance,
      dcuplServer: serverDcuplInstance,
    },
  };
});
