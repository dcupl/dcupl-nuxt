import { createError, defineEventHandler, getHeader, getQuery, useNitroApp, useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const authorizationHeader = getHeader(event, 'Authorization')
  const { token: authorizationToken } = getQuery(event)

  const authorization = authorizationHeader || authorizationToken

  const { dcupl } = useRuntimeConfig()

  if (authorization !== dcupl.reloadHook?.secret) {
    throw createError({
      status: 401,
      statusMessage: 'Unauthorized',
    })
  }
  const nitroApp = useNitroApp()
  if (nitroApp._dcuplNitroInstance) {
    await nitroApp._dcuplNitroInstance.init()
    console.info('[DCUPL] Reloaded nitro instance')
  }
  return {
    status: 200,
    statusMessage: 'OK',
  }
})
