import { useDcuplServerInstance } from "#dcupl/server";

export default defineEventHandler(async (event) => {
  const dcupl = await useDcuplServerInstance(event);
  const list = dcupl.lists.create({ modelKey: "Article" });
  return {
    id: dcupl.query.one({ modelKey: "Instance", itemKey: "current" })?.id,
    count: list.catalog.query.execute().length,
  };
});
