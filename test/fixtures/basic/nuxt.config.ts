import { fileURLToPath } from "node:url";
import MyModule from "../../../src/module";

export default defineNuxtConfig({
  modules: [MyModule],
  // build instances from in-memory data instead of the dcupl CDN
  alias: {
    "@dcupl/loader": fileURLToPath(new URL("./stub-loader.ts", import.meta.url)),
  },
  dcupl: {
    reloadHook: { secret: "test-secret" },
    updateCheckInterval: false,
    // like a real project without changes: only the first check reports one
    shouldUpdate: async () => {
      const state = globalThis as { __dcuplChecks?: number };
      state.__dcuplChecks = (state.__dcuplChecks ?? 0) + 1;
      return state.__dcuplChecks === 1;
    },
  },
});
