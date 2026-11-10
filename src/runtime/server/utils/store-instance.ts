// eslint-disable-next-line @typescript-eslint/triple-slash-reference -- declares the #dcupl/should-update server template
/// <reference path="../virtual.d.ts" />
import { useRuntimeConfig } from "nitropack/runtime";
import { customShouldUpdate } from "#dcupl/should-update";
import type { DcuplModuleOptions } from "../../../module";
import { createDcupl, createStatusCheck } from "../../dcupl/create-dcupl";
import { DcuplServerStore } from "./dcupl-store";

const DEFAULT_UPDATE_CHECK_INTERVAL = 60_000;

let store: DcuplServerStore | undefined;

/** The dcupl store of this server process (created on first use). */
export function useDcuplServerStore(): DcuplServerStore {
  if (!store) {
    const runtimeConfig = useRuntimeConfig();
    const options = runtimeConfig.public.dcupl as DcuplModuleOptions;
    const interval = runtimeConfig.dcupl?.updateCheckInterval as
      | number
      | false
      | undefined;
    store = new DcuplServerStore({
      create: async () => (await createDcupl(options)).dcupl,
      shouldUpdate: options.useCustomUpdateFunction
        ? async () => !!(await customShouldUpdate())
        : createStatusCheck(options.config?.projectId, url => $fetch(url)),
      interval:
        interval === false
          ? false
          : Number(interval ?? DEFAULT_UPDATE_CHECK_INTERVAL),
    });
  }
  return store;
}
