import { defineNitroPlugin } from "nitropack/runtime";
import { createRequestScope } from "./utils/request-scope";
import { useDcuplServerStore } from "./utils/store-instance";

/**
 * Gives every request a scope over the process-wide dcupl instance (leased on
 * first use) and cleans it up when the response is done.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("request", (event) => {
    const scope = createRequestScope(() => useDcuplServerStore().acquire());
    event.context._dcuplScope = scope;
    // h3 skips afterResponse when an error handler sent the response, and an
    // aborted request never gets one; 'close' comes in every case
    event.node.res.once("close", () => scope.dispose());
  });
  nitroApp.hooks.hook("afterResponse", (event) => {
    event.context._dcuplScope?.dispose();
  });
});
