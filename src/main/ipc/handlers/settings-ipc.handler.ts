import type { IpcInvokeHandlers } from '@shared/types/ipc/ipc-invoke.type'

import { BaseIpcDomainHandler } from '../core/base-ipc-domain.handler'
import type { IIpcDomainHandler } from '../ipc-handler.types'
import type { ISettingsService } from '../services/settings.service'

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
