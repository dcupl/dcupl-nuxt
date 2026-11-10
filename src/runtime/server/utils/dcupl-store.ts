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
  leases: number;
  retired: boolean;
  destroyed: boolean;
}

/**
 * Holds the one dcupl instance of a server process, shared by SSR rendering
 * and Nitro API routes.
 *
 * - Requests lease the current instance and release it when they finish.
 * - At most one update check runs per `interval`; concurrent callers share it.
 *   A failed rebuild is retried at the next check.
 * - An update builds the new instance completely before it is swapped in, and
 *   the old instance is destroyed only after its last lease was released.
 */
export class DcuplServerStore {
  private active: Generation | undefined;
  private initial: Promise<void> | undefined;
  private reloading: Promise<Dcupl> | undefined;
  private checking: Promise<void> | undefined;
  private lastCheck = 0;
  private leases = 0;
  /** A rebuild failed; the next check rebuilds even if nothing changed since. */
  private stale = false;
  private readonly now: () => number;
  private readonly onError: (error: unknown) => void;

  constructor(private readonly options: DcuplServerStoreOptions) {
    this.now = options.now ?? Date.now;
    this.onError
      = options.onError ?? (error => console.error("[dcupl]", error));
  }

  /** Leases held by requests right now, over all instances (diagnostics and tests). */
  get openLeases(): number {
    return this.leases;
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
    generation.leases++;
    this.leases++;
    let released = false;
    return {
      dcupl: generation.dcupl,
      release: () => {
        if (released) return;
        released = true;
        generation.leases--;
        this.leases--;
        this.destroyIfUnused(generation);
      },
    };
  }

  /** Runs an update check unless one ran within `interval` or one is running. */
  checkForUpdate(): Promise<void> {
    if (this.checking) return this.checking;
    if (this.options.interval === false) return Promise.resolve();
    if (this.now() - this.lastCheck < this.options.interval) {
      return Promise.resolve();
    }
    this.lastCheck = this.now();
    this.checking = this.options
      .shouldUpdate()
      .then(async (changed) => {
        if (changed || this.stale) await this.swap(false);
      })
      .catch(this.onError)
      .finally(() => {
        this.checking = undefined;
      });
    return this.checking;
  }

  /** Builds a new instance and swaps it in (used by the reload hook). */
  reload(): Promise<Dcupl> {
    return this.swap(true);
  }

  private ensureInitial(): Promise<void> {
    if (!this.initial) {
      this.lastCheck = this.now();
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
        let dcupl: Dcupl;
        try {
          dcupl = await this.build(recordBaseline);
        }
        catch (error) {
          // the update check has already recorded the change: retry next time
          this.stale = true;
          throw error;
        }
        this.stale = false;
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
    return { dcupl, leases: 0, retired: false, destroyed: false };
  }

  private destroyIfUnused(generation: Generation): void {
    if (!generation.retired || generation.leases > 0 || generation.destroyed) {
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
