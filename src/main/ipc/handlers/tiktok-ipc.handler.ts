import { BaseIpcDomainHandler } from '@main/ipc/core/base-ipc-domain.handler'
import { IIpcDomainHandler } from '@main/ipc/ipc-handler.types'
import { ITiktokService } from '@main/ipc/services/tiktok.service'
import type { IpcInvokeHandlers } from '@shared/types/ipc/ipc-invoke.type'

type TiktokInvokeHandlers = Pick<
  IpcInvokeHandlers,
  'getUserAwemeList' | 'getUserInfo' | 'getMultiAwemeDetails'
>

export class TiktokIpcHandler extends BaseIpcDomainHandler implements IIpcDomainHandler {
  constructor(private readonly tiktokService: ITiktokService) {
    super()
  }

  public getInvokeHandlers(): TiktokInvokeHandlers {
    return {
      getUserAwemeList: async (options) =>
        this.executeQuery(async () => this.tiktokService.getUserAwemeList(options)),

      getUserInfo: async (username) =>
        this.executeQuery(async () => this.tiktokService.getUserInfo(username)),

      getMultiAwemeDetails: async (awemeIds) =>
        this.executeQuery(async () => this.tiktokService.getMultiAwemeDetails(awemeIds))
    }
  }
}
