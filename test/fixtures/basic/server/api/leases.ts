// test-only: what requests still hold on the server, read straight from the store
import { useDcuplServerStore } from "../../../../../src/runtime/server/utils/store-instance";

export default defineEventHandler(async () => {
  const store = useDcuplServerStore();
  const { dcupl, release } = await store.acquire();
  const lists = dcupl.lists.getAll().length;
  release();
  return { leases: store.openLeases, lists };
});
