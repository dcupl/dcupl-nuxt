import type { H3Event } from "h3";
import type { Dcupl } from "@dcupl/core";
import { DcuplInstance } from "../../dcupl/dcupl.instance";
import { useNitroApp, useRuntimeConfig } from "#imports";

declare module "nitropack" {
  interface NitroApp {
    _dcuplNitroInstance: DcuplInstance;
  }
}

export const useDcuplServerInstance: (
  event: H3Event
) => Promise<Dcupl> = async (event: H3Event) => {
  if (!event.context._dcupl) {
    const nitroApp = useNitroApp();

    if (!nitroApp._dcuplNitroInstance) {
      const { dcupl: dcuplConfig } = useRuntimeConfig().public;
      const dcuplNitroInstance = new DcuplInstance(
        "nitro_instance",
        dcuplConfig
      );
      await dcuplNitroInstance.init();
      nitroApp._dcuplNitroInstance = dcuplNitroInstance;
    } else if (await nitroApp._dcuplNitroInstance.shouldUpdate()) {
      // Unlike the SSR `serverDcuplInstance` (which is re-validated on every
      // request in the plugin), the Nitro instance is created once and would
      // otherwise keep serving stale data to server API routes until the
      // process restarts. When the dcupl data has changed, reload it here.
      //
      // The reload is awaited on purpose: a fire-and-forget reload would still
      // serve the old (or missing) data on the very request that detects the
      // change — e.g. a newly created item would 404. `shouldUpdate()` only
      // returns true once per actual change (guarded by an internal
      // `changedAt`), so the expensive reload runs at most once per data
      // change while all other requests just perform one lightweight check.
      await nitroApp._dcuplNitroInstance.init();
    }

    return nitroApp._dcuplNitroInstance.dcupl;
  } else {
    return event.context._dcupl;
  }
};
