import { useDcuplServerInstance } from "#dcupl/server";

export default defineEventHandler(async (event) => {
  const dcupl = await useDcuplServerInstance(event);
  dcupl.lists.create({ modelKey: "Article" });
  throw createError({ statusCode: 500, statusMessage: "route failed" });
});
