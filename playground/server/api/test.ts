import { useDcuplServerInstance } from '#dcupl'

export default defineEventHandler(async (event) => {
  const dcupl = await useDcuplServerInstance(event)

  const articleList = dcupl.lists.create({ modelKey: 'Article' })
  articleList.catalog.query.applyOptions({ count: 10 })
  return articleList.catalog.query.execute()
})
