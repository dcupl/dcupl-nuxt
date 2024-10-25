import { Dcupl } from '@dcupl/core'
import { DcuplAppLoader } from '@dcupl/loader'
import type { DcuplModuleOptions } from '../module'

/**
 * This class is used to manage the dcupl instance.
 * @author Dominik Strasser (dcupl)
 * @modifiedBy Markus Geilehner
 * @see https://github.com/dcupl/dcupl-nuxt-starter/blob/main/dcupl/dcupl.instance.ts
 */
export class DcuplInstance {
  public dcupl!: Dcupl
  public dcuplAppLoader!: DcuplAppLoader
  public changedAt = 0
  private options: DcuplModuleOptions

  constructor(public type: string, options?: DcuplModuleOptions) {
    this.options = options
  }

  public async init(overwriteOptions?: DcuplModuleOptions) {
    this.options = overwriteOptions || this.options
    try {
      const response = await this.getNewDcuplInstance()
      // destroy existing instance if it exists
      if (this.dcupl) {
        this.dcupl.destroy()
      }
      this.dcupl = response.dcupl
      this.dcuplAppLoader = response.loader
      // console.log('[dcupl initialized]', this.type, this.changedAt)
    }
    catch (err) {
      console.log(err)
    }
  }

  /**
   * Fetches the 'Status' (containing a changedAt timestamp) from the dcupl API to
   * decide if the server instance should be updated.
   * It only works if the data & model files are all loaded from the dcupl CDN since
   * the dcupl API does not intercept files loaded from other sources.
   * Depending on your use case, you may have to modify this function.
   */
  public async shouldUpdate() {
    // TODO add custom functionality to module options.
    if (!this.options?.config?.projectId) return true
    const response: any = await $fetch(
      `https://api.dcupl.com/projects/${this.options.config.projectId}/files/versions/draft/status`,
    )

    const changedAt = response?.changedAt
    if (changedAt && changedAt > this.changedAt) {
      this.changedAt = changedAt
      return true
    }
    return false
  }

  private async getNewDcuplInstance() {
    const dcupl = new Dcupl(this.options)

    const dcuplAppLoader = new DcuplAppLoader()

    dcupl.loaders.add(dcuplAppLoader)

    await dcuplAppLoader.config.fetch()
    await dcuplAppLoader.process(this.options.loader)

    await dcupl.init()

    return { dcupl, loader: dcuplAppLoader }
  }
}
