import type { H3Event } from 'h3'
import type { Dcupl } from '@dcupl/core'
import { DcuplInstance } from '../../../dcupl/dcupl.instance'
import { useNitroApp, useRuntimeConfig } from '#imports'

declare module 'nitropack' {
  interface NitroApp {
    _dcuplNitroInstance: DcuplInstance
  }
}

export const useDcuplServerInstance: (event: H3Event) => Promise<Dcupl> = async (event: H3Event) => {
  if (!event.context._dcupl) {
    const nitroApp = useNitroApp()

    if (!nitroApp._dcuplNitroInstance) {
      const { dcupl: dcuplConfig } = useRuntimeConfig().public
      const dcuplNitroInstance = new DcuplInstance('nitro_instance', dcuplConfig)
      await dcuplNitroInstance.init()
      nitroApp._dcuplNitroInstance = dcuplNitroInstance
    }
    // Since this is stored on Server Side, maybe add a request to "update" the context instaed of validating on every request
    // if (await nitroApp._dcuplNitroInstance.shouldUpdate()) {
    //   nitroApp._dcuplNitroInstance.init() // update async
    // }
    //
    return nitroApp._dcuplNitroInstance.dcupl
  }
  else {
    return event.context._dcupl as Dcupl
  }
}
