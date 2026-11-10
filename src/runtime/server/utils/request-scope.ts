import type { Dcupl, DcuplList } from "@dcupl/core";

/** A request's hold on the process-wide instance. */
export interface DcuplLease {
  dcupl: Dcupl;
  /** Hands the instance back; idempotent. */
  release: () => void;
}

/** The dcupl instance of one request, see `createRequestScope`. */
export interface DcuplRequestScope {
  /** The shared instance, wrapped so that lists created through it belong to this request. */
  get: () => Promise<Dcupl>;
  /** Destroys the lists this request created, and only those. */
  destroyLists: () => void;
  /** Destroys this request's lists and releases the instance once; safe to call again. */
  dispose: () => void;
}

declare module "h3" {
  interface H3EventContext {
    _dcuplScope?: DcuplRequestScope;
  }
}

function bindTo<T extends object>(target: T, prop: string | symbol): unknown {
  const value = Reflect.get(target, prop, target);
  return typeof value === "function" ? value.bind(target) : value;
}

/**
 * Wraps the shared instance for one request: `lists.create()` records the new
 * list, `lists.destroy()` without options destroys only the recorded lists.
 * Everything else goes straight to the shared instance.
 */
export function scopeDcupl(dcupl: Dcupl, lists: Set<DcuplList>): Dcupl {
  const target = dcupl.lists;
  const scopedLists = new Proxy(target, {
    get(_target, prop) {
      if (prop === "create") {
        return (...args: Parameters<Dcupl["lists"]["create"]>) => {
          const list = target.create(...args);
          lists.add(list as DcuplList);
          return list;
        };
      }
      if (prop === "destroy") {
        return (options?: Parameters<Dcupl["lists"]["destroy"]>[0]) => {
          if (options) return target.destroy(options);
          destroyAll(lists);
        };
      }
      return bindTo(target, prop);
    },
  });
  return new Proxy(dcupl, {
    get(_target, prop) {
      return prop === "lists" ? scopedLists : bindTo(dcupl, prop);
    },
  });
}

function destroyAll(lists: Set<DcuplList>): void {
  for (const list of lists) {
    try {
      list.destroy();
    }
    catch {
      // already gone with its instance
    }
  }
  lists.clear();
}

/** Creates the per-request scope; the instance is leased on the first `get()`. */
export function createRequestScope(
  acquire: () => Promise<DcuplLease>,
): DcuplRequestScope {
  const lists = new Set<DcuplList>();
  let lease: Promise<DcuplLease> | undefined;
  let scoped: Promise<Dcupl> | undefined;
  let disposed = false;
  return {
    get() {
      if (!scoped) {
        lease = acquire();
        scoped = lease.then(({ dcupl }) => scopeDcupl(dcupl, lists));
      }
      return scoped;
    },
    destroyLists() {
      destroyAll(lists);
    },
    dispose() {
      // every call: an aborted request can still create lists after 'close'
      destroyAll(lists);
      if (disposed) return;
      disposed = true;
      lease?.then(
        ({ release }) => release(),
        () => undefined,
      );
    },
  };
}
