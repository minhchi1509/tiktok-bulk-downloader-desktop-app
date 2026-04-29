import type { IpcInvokeHandlers } from '@shared/types/ipc/ipc-invoke.type'

import {
  DownloadIpcHandler,
  SettingsIpcHandler,
  TiktokIpcHandler,
  UpdaterIpcHandler
} from './handlers'
import type { IIpcDomainHandler, ISetupIpcHandlersOptions } from './ipc-handler.types'
import { registerInvokeHandlers } from './register-invoke-handlers'
import { ElectronDownloadService } from './services/download.service'
import { JsonSettingsService } from './services/settings.service'
import { TiktokService } from './services/tiktok.service'
import { ElectronUpdaterService } from './services/updater.service'

class IpcHandlerOrchestrator {
  private readonly domainHandlers: IIpcDomainHandler[]

  constructor(private readonly options: ISetupIpcHandlersOptions) {
    const settingsService = new JsonSettingsService()
    const tiktokService = new TiktokService(settingsService)
    const downloadService = new ElectronDownloadService()
    const updaterService = new ElectronUpdaterService()

    const tiktokHandler = new TiktokIpcHandler(tiktokService)
    const downloadHandler = new DownloadIpcHandler(downloadService)
    const settingsHandler = new SettingsIpcHandler(settingsService)
    const updaterHandler = new UpdaterIpcHandler(this.options.mainWindow, updaterService)

    this.domainHandlers = [tiktokHandler, downloadHandler, settingsHandler, updaterHandler]
  }

  public registerAll(): void {
    const invokeHandlers = this.domainHandlers.reduce<IpcInvokeHandlers>(
      (handlers, domainHandler) => {
        Object.assign(handlers, domainHandler.getInvokeHandlers())
        return handlers
      },
      {} as IpcInvokeHandlers
    )

    registerInvokeHandlers(invokeHandlers)

    this.domainHandlers.forEach((domainHandler) => {
      domainHandler.registerEvents?.()
    })
  }
}

export default IpcHandlerOrchestrator
