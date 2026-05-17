import { app } from 'electron'

import type { IpcInvokeHandlers } from '@shared/types/ipc/ipc-invoke.type'
import { BaseIpcDomainHandler } from '@main/ipc/core/base-ipc-domain.handler'
import { IIpcDomainHandler } from '@main/ipc/ipc-handler.types'

type AppInfoInvokeHandlers = Pick<IpcInvokeHandlers, 'getAppVersion'>

export class AppInfoIpcHandler extends BaseIpcDomainHandler implements IIpcDomainHandler {
  public getInvokeHandlers(): AppInfoInvokeHandlers {
    return {
      getAppVersion: async () => this.executeQuery(async () => app.getVersion())
    }
  }
}
