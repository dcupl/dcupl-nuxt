import { useDcuplServerInstance } from "#dcupl";

export default defineEventHandler(async (event) => {
  const dcupl = await useDcuplServerInstance(event);

  return dcupl.query.execute({
    modelKey: "Article",
    count: 10,
    queries: [],
  });
});
