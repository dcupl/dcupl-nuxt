import { defineNitroPlugin } from "nitropack/runtime";
import { createRequestScope } from "./utils/request-scope";
import { useDcuplServerStore } from "./utils/store-instance";

/**
 * Gives every request a scope over the process-wide dcupl instance (leased on
 * first use) and cleans it up when the response is done.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("request", (event) => {
    event.context._dcuplScope = createRequestScope(() =>
      useDcuplServerStore().acquire(),
    );
  });
  nitroApp.hooks.hook("afterResponse", (event) => {
    event.context._dcuplScope?.dispose();
  });
});
