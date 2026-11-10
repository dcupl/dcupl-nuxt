import type { Dcupl } from "@dcupl/core";
import type { DcuplAppLoader } from "@dcupl/loader";
import type { DcuplModuleOptions } from "../../module";
import { createDcupl } from "./create-dcupl";

/**
 * Holds the browser's dcupl instance (`useNuxtApp().$dcuplSession`).
 * On the server the instance lives in the Nitro store, see `server/utils/dcupl-store.ts`.
 */
export class DcuplInstance {
  public dcupl!: Dcupl;
  public dcuplAppLoader!: DcuplAppLoader;
  private options: DcuplModuleOptions | undefined;

  constructor(public type: string, options?: DcuplModuleOptions) {
    this.options = options;
  }

  /** Builds a new instance, then swaps it in and destroys the previous one. */
  public async init(overwriteOptions?: DcuplModuleOptions): Promise<void> {
    this.options = overwriteOptions || this.options;
    if (!this.options) {
      throw new Error("[dcupl] no options provided");
    }
    try {
      const { dcupl, loader } = await createDcupl(this.options);
      const previous = this.dcupl;
      this.dcupl = dcupl;
      this.dcuplAppLoader = loader;
      previous?.destroy();
    }
    catch (err) {
      console.error("[dcupl] init failed", err);
    }
  }
}
