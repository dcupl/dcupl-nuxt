import type { H3Event } from 'h3'
import type { Dcupl } from '@dcupl/core'
import { DcuplInstance } from '../../../dcupl/dcupl.instance'

export const useDcuplServerInstance: (event: H3Event) => Promise<Dcupl> = async (event: H3Event) => {
  if (!event.context._dcupl) {
    const nitroApp = useNitroApp() as { _dcuplSession: DcuplInstance }
    if (!nitroApp._dcuplSession) {
      const { dcupl } = useRuntimeConfig().public
      const dcuplSession = new DcuplInstance('nitro_instance', dcupl)
      await dcuplSession.init()
      nitroApp._dcuplSession = dcuplSession
    }
    // Since this is stored on Server Side, maybe add a request to "update" the context instaed of validating on every request
    // if (await nitroApp._dcuplSession.shouldUpdate()) {
    //   nitroApp._dcuplSession.init() // update async
    // }
    //
    return nitroApp._dcuplSession.dcupl
  }
  else {
    return event.context._dcupl as Dcupl
  }
}
