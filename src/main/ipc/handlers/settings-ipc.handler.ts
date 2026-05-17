import { BaseIpcDomainHandler } from '@main/ipc/core/base-ipc-domain.handler'
import { IIpcDomainHandler } from '@main/ipc/ipc-handler.types'
import { ISettingsService } from '@main/ipc/services/settings.service'
import type { IpcInvokeHandlers } from '@shared/types/ipc/ipc-invoke.type'

type SettingsInvokeHandlers = Pick<IpcInvokeHandlers, 'getSettings' | 'saveSettings'>

export class SettingsIpcHandler extends BaseIpcDomainHandler implements IIpcDomainHandler {
  constructor(private readonly settingsService: ISettingsService) {
    super()
  }

  public getInvokeHandlers(): SettingsInvokeHandlers {
    return {
      getSettings: async (key) =>
        this.executeQuery(async () => this.settingsService.get(key), 'Failed to read settings'),

      saveSettings: async (key, value) =>
        this.executeCommand(
          () => this.settingsService.set(key, value),
          (error) => {
            console.error('Error saving settings:', error)
          }
        )
    }
  }
}
