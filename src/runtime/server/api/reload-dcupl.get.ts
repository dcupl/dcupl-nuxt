import { getHeaders } from '../../../../playground/.nuxt/types/nitro-imports'

export default defineEventHandler(async (event) => {
  const authorization = getHeader(event, 'Authorization')
  const { dcupl } = useRuntimeConfig()
  if (authorization !== dcupl.reloadHook?.secret) {
    throw createError({
      status: 401,
      statusMessage: 'Unauthorized',
    })
  }
  const nitroApp = useNitroApp()
  if (nitroApp._dcuplSession) {
    await nitroApp._dcuplSession.init()
    console.info('[DCUPL] Reloaded nitro instance')
  }
  return {
    status: 200,
    statusMessage: 'OK',
  }
})
