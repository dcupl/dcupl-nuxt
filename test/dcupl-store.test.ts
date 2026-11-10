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
