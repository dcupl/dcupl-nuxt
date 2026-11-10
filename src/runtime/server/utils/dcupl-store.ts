import type { Dcupl } from "@dcupl/core";
import type { DcuplLease } from "./request-scope";

export interface DcuplServerStoreOptions {
  /** Builds a fully initialised instance. */
  create: () => Promise<Dcupl>;
  /** Answers whether the data changed since the last call. */
  shouldUpdate: () => Promise<boolean>;
  /** Minimum time between two update checks in ms, `false` disables them. */
  interval: number | false;
  now?: () => number;
  onError?: (error: unknown) => void;
}

interface Generation {
  dcupl: Dcupl;
  retired: boolean;
  destroyed: boolean;
}

/**
 * Holds the one dcupl instance of a server process, shared by SSR rendering
 * and Nitro API routes.
 *
 * - An update builds the new instance completely before it is swapped in.
 */
export class DcuplServerStore {
  private active: Generation | undefined;
  private initial: Promise<void> | undefined;
  private reloading: Promise<Dcupl> | undefined;
  private readonly onError: (error: unknown) => void;

  constructor(private readonly options: DcuplServerStoreOptions) {
    this.onError
      = options.onError ?? (error => console.error("[dcupl]", error));
  }

  /** Leases the current instance; the first call waits for the initial build. */
  async acquire(): Promise<DcuplLease> {
    if (this.active) {
      void this.checkForUpdate();
    }
    else {
      await this.ensureInitial();
    }
    // read synchronously after the await: always the newest instance
    const generation = this.active!;
    return { dcupl: generation.dcupl, release: () => undefined };
  }

  /** Runs an update check (on every request unless `interval` is false). */
  checkForUpdate(): Promise<void> {
    if (this.options.interval === false) return Promise.resolve();
    return this.options
      .shouldUpdate()
      .then(async (changed) => {
        if (changed) await this.swap(false);
      })
      .catch(this.onError);
  }

  /** Builds a new instance and swaps it in (used by the reload hook). */
  reload(): Promise<Dcupl> {
    return this.swap(true);
  }

  private ensureInitial(): Promise<void> {
    if (!this.initial) {
      this.initial = this.build(true).then(
        (dcupl) => {
          this.active ??= this.generation(dcupl);
        },
        (error) => {
          // let the next request try again
          this.initial = undefined;
          throw error;
        },
      );
    }
    return this.initial;
  }

  private swap(recordBaseline: boolean): Promise<Dcupl> {
    if (!this.reloading) {
      this.reloading = (async () => {
        if (!this.active) await this.ensureInitial();
        const dcupl = await this.build(recordBaseline);
        const previous = this.active;
        this.active = this.generation(dcupl);
        if (previous) {
          previous.retired = true;
          this.destroyIfUnused(previous);
        }
        return dcupl;
      })().finally(() => {
        this.reloading = undefined;
      });
    }
    return this.reloading;
  }

  /** Builds an instance; with `recordBaseline` the update check runs alongside so it remembers this state. */
  private async build(recordBaseline: boolean): Promise<Dcupl> {
    const [dcupl] = await Promise.all([
      this.options.create(),
      recordBaseline
        ? this.options.shouldUpdate().catch(this.onError)
        : undefined,
    ]);
    return dcupl;
  }

  private generation(dcupl: Dcupl): Generation {
    return { dcupl, retired: false, destroyed: false };
  }

  private destroyIfUnused(generation: Generation): void {
    if (!generation.retired || generation.destroyed) {
      return;
    }
    generation.destroyed = true;
    try {
      generation.dcupl.destroy();
    }
    catch (error) {
      this.onError(error);
    }
  }
}
