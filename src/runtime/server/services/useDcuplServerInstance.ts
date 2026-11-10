import type { H3Event } from "h3";
import type { Dcupl } from "@dcupl/core";
import { createRequestScope } from "../utils/request-scope";
import { useDcuplServerStore } from "../utils/store-instance";

/**
 * The dcupl instance of this server process, the same one SSR rendering uses.
 * Lists created through it are destroyed when the request has finished.
 */
export const useDcuplServerInstance = (event: H3Event): Promise<Dcupl> => {
  event.context._dcuplScope ??= createRequestScope(() =>
    useDcuplServerStore().acquire(),
  );
  return event.context._dcuplScope.get();
};
