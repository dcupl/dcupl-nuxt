import { describe, it, expect, vi } from "vitest";
import { Dcupl } from "@dcupl/core";
import { createRequestScope } from "../src/runtime/server/utils/request-scope";

async function articles(): Promise<Dcupl> {
  const dcupl = new Dcupl();
  dcupl.models.set({
    key: "Article",
    properties: [{ key: "name", type: "string", filter: true }],
  });
  dcupl.data.set(
    [
      { key: "1", name: "one" },
      { key: "2", name: "two" },
    ],
    { model: "Article" },
  );
  await dcupl.init();
  return dcupl;
}

describe("request scope (bug 1: app:rendered destroyed every list on the shared instance)", () => {
  it("destroys only the lists of the request that finished rendering", async () => {
    const shared = await articles();
    const lease = async () => ({ dcupl: shared, release: vi.fn() });
    const requestA = createRequestScope(lease);
    const requestB = createRequestScope(lease);

    const listA = (await requestA.get()).lists.create({ modelKey: "Article" });
    const listB = (await requestB.get()).lists.create({ modelKey: "Article" });
    expect(shared.lists.getAll()).toHaveLength(2);

    requestA.destroyLists();

    expect(shared.lists.getAll()).toEqual([listB]);
    expect(listB.catalog.query.execute()).toHaveLength(2);
    expect(shared.lists.getAll()).not.toContain(listA);
  });

  it("lists.destroy() without options stays inside the request", async () => {
    const shared = await articles();
    const lease = async () => ({ dcupl: shared, release: vi.fn() });
    const other = (await createRequestScope(lease).get()).lists.create({
      modelKey: "Article",
    });
    const mine = await createRequestScope(lease).get();
    mine.lists.create({ modelKey: "Article" });

    mine.lists.destroy();

    expect(shared.lists.getAll()).toEqual([other]);
  });

  it("dispose destroys the lists, releases the lease once and passes other calls through", async () => {
    const shared = await articles();
    const release = vi.fn();
    const scope = createRequestScope(async () => ({ dcupl: shared, release }));
    const dcupl = await scope.get();
    expect(dcupl).toBeInstanceOf(Dcupl);
    expect(dcupl.query.one({ modelKey: "Article", itemKey: "2" })).toMatchObject({ name: "two" });
    dcupl.lists.create({ modelKey: "Article" });

    scope.dispose();
    scope.dispose();
    await Promise.resolve();

    expect(shared.lists.getAll()).toHaveLength(0);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("a later dispose destroys lists created after the first one, the lease goes back once", async () => {
    const shared = await articles();
    const release = vi.fn();
    const scope = createRequestScope(async () => ({ dcupl: shared, release }));
    const dcupl = await scope.get();

    // the client went away ('close'), rendering goes on until afterResponse
    scope.dispose();
    dcupl.lists.create({ modelKey: "Article" });
    scope.dispose();
    await Promise.resolve();

    expect(shared.lists.getAll()).toHaveLength(0);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("does not lease an instance when the request never asked for one", () => {
    const acquire = vi.fn();
    createRequestScope(acquire).dispose();
    expect(acquire).not.toHaveBeenCalled();
  });
});
