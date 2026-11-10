import { describe, it, expect, vi } from "vitest";
import type { Dcupl } from "@dcupl/core";
import { DcuplServerStore } from "../src/runtime/server/utils/dcupl-store";

function fakeDcupl(name: string): Dcupl {
  return { name, destroy: vi.fn() } as unknown as Dcupl;
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function setup(options: { interval?: number | false } = {}) {
  let clock = 1_000_000;
  const builds: Dcupl[] = [];
  const create = vi.fn(async () => {
    const dcupl = fakeDcupl(`build-${builds.length + 1}`);
    builds.push(dcupl);
    return dcupl;
  });
  const shouldUpdate = vi.fn(async () => false);
  const store = new DcuplServerStore({
    create,
    shouldUpdate,
    interval: options.interval ?? 60_000,
    now: () => clock,
    onError: () => undefined,
  });
  const tick = (ms: number) => {
    clock += ms;
  };
  const burst = (n = 30) =>
    Promise.all(Array.from({ length: n }, () => store.acquire()));
  return { store, create, shouldUpdate, builds, tick, burst };
}

describe("update checks (bug 2: a status call on every SSR request)", () => {
  it("checks at most once per interval, however many requests come in", async () => {
    const { shouldUpdate, create, tick, burst } = setup();

    await burst();
    // initial build plus one call that records the current state
    expect(create).toHaveBeenCalledTimes(1);
    expect(shouldUpdate).toHaveBeenCalledTimes(1);

    tick(30_000);
    await burst();
    expect(shouldUpdate).toHaveBeenCalledTimes(1);

    tick(30_001);
    await burst();
    expect(shouldUpdate).toHaveBeenCalledTimes(2);

    tick(1_000);
    await burst();
    expect(shouldUpdate).toHaveBeenCalledTimes(2);
  });

  it("shares one in-flight check between concurrent callers", async () => {
    const { store, shouldUpdate, burst } = setup({ interval: 0 });
    await burst(1);
    const pending = deferred<boolean>();
    shouldUpdate.mockImplementation(() => pending.promise);

    const checks = Array.from({ length: 10 }, () => store.checkForUpdate());
    expect(shouldUpdate).toHaveBeenCalledTimes(2);
    pending.resolve(false);
    await Promise.all(checks);
  });

  it("makes no checks when the interval is false", async () => {
    const { shouldUpdate, tick, burst } = setup({ interval: false });
    await burst();
    tick(10 * 60_000);
    await burst();
    expect(shouldUpdate).toHaveBeenCalledTimes(1);
  });
});

describe("swapping instances (bug 3: init() not awaited, old instance destroyed in use)", () => {
  it("serves the old instance until the new one is completely built", async () => {
    const { store, create, shouldUpdate, builds, tick } = setup();
    const first = await store.acquire();

    const build = deferred<Dcupl>();
    create.mockImplementationOnce(() => build.promise);
    shouldUpdate.mockResolvedValueOnce(true);
    tick(60_000);
    const check = store.checkForUpdate();

    const during = await store.acquire();
    expect(during.dcupl).toBe(first.dcupl);
    expect(builds[0]!.destroy).not.toHaveBeenCalled();

    const next = fakeDcupl("build-2");
    build.resolve(next);
    await check;
    expect((await store.acquire()).dcupl).toBe(next);
  });

  it("destroys the old instance only after the last request holding it is done", async () => {
    const { store, builds } = setup();
    const a = await store.acquire();
    const b = await store.acquire();

    await store.reload();
    expect(builds[0]!.destroy).not.toHaveBeenCalled();

    a.release();
    a.release(); // idempotent
    expect(builds[0]!.destroy).not.toHaveBeenCalled();
    b.release();
    expect(builds[0]!.destroy).toHaveBeenCalledTimes(1);
    expect(builds[1]!.destroy).not.toHaveBeenCalled();
  });

  it("destroys an unused old instance right after the swap", async () => {
    const { store, builds } = setup();
    (await store.acquire()).release();
    await store.reload();
    expect(builds[0]!.destroy).toHaveBeenCalledTimes(1);
  });

  it("keeps the current instance when building the new one fails", async () => {
    const { store, create, builds } = setup();
    const first = await store.acquire();
    create.mockRejectedValueOnce(new Error("CDN down"));

    await expect(store.reload()).rejects.toThrow("CDN down");
    expect((await store.acquire()).dcupl).toBe(first.dcupl);
    expect(builds[0]!.destroy).not.toHaveBeenCalled();
  });

  it("builds once when concurrent reloads come in", async () => {
    const { store, create } = setup();
    await store.acquire();
    await Promise.all([store.reload(), store.reload(), store.reload()]);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("retries the initial build on the next request after a failure", async () => {
    const { store, create } = setup();
    create.mockRejectedValueOnce(new Error("offline"));
    await expect(store.acquire()).rejects.toThrow("offline");
    await expect(store.acquire()).resolves.toBeTruthy();
    expect(create).toHaveBeenCalledTimes(2);
  });
});
