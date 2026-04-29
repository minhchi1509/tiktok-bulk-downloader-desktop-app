import type { IpcInvokeHandlers } from '@shared/types/ipc/ipc-invoke.type'

import { BaseIpcDomainHandler } from '../core/base-ipc-domain.handler'
import type { IIpcDomainHandler } from '../ipc-handler.types'
import type { IDownloadService } from '../services/download.service'

type DownloadInvokeHandlers = Pick<
  IpcInvokeHandlers,
  'selectFolder' | 'downloadFile' | 'getDefaultDownloadPath'
>

export class DownloadIpcHandler extends BaseIpcDomainHandler implements IIpcDomainHandler {
  constructor(private readonly downloadService: IDownloadService) {
    super()
  }

  public getInvokeHandlers(): DownloadInvokeHandlers {
    return {
      selectFolder: async () => this.executeQuery(async () => this.downloadService.selectFolder()),

      downloadFile: async (options) =>
        this.executeQuery(async () => {
          await this.downloadService.downloadFile(options)
          return true
        }),

      getDefaultDownloadPath: async () =>
        this.executeQuery(async () => this.downloadService.getDefaultDownloadPath())
    }
  }
}
