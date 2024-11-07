import { DcuplInstance } from "./dcupl/dcupl.instance";
import type { DcuplModuleOptions } from "../module";
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
  if (import.meta.server) {
    await initializeOrUpdateServerClient(dcuplConfig);
    const event = useRequestEvent();
    if (event) {
      event.context._dcupl = serverDcuplInstance.dcupl;
    }
  } else {
    await sessionDcuplInstance.init(dcuplConfig);
  }

  const { hook } = _nuxtApp;

  hook("app:rendered", () => {
    if (serverDcuplInstance.dcupl) {
      serverDcuplInstance.dcupl.lists.destroy();
    }
  });

  return {
    provide: {
      dcupl: import.meta.server
        ? serverDcuplInstance.dcupl
        : sessionDcuplInstance.dcupl,
      dcuplSession: sessionDcuplInstance,
      dcuplServer: serverDcuplInstance,
    },
  };
});
