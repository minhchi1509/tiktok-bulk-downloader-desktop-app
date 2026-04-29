import type { BrowserWindow } from 'electron'
import { app } from 'electron'

import { IPC_EVENT_CHANNELS } from '@shared/types/ipc/ipc-event.type'
import type { IpcInvokeHandlers } from '@shared/types/ipc/ipc-invoke.type'

import { BaseIpcDomainHandler } from '../core/base-ipc-domain.handler'
import type { IIpcDomainHandler } from '../ipc-handler.types'
import type { IUpdaterService } from '../services/updater.service'

type MainWindowGetter = () => BrowserWindow | null

type UpdaterInvokeHandlers = Pick<
  IpcInvokeHandlers,
  'checkForUpdates' | 'downloadUpdate' | 'quitAndInstall'
>

export class UpdaterIpcHandler extends BaseIpcDomainHandler implements IIpcDomainHandler {
  constructor(
    private readonly mainWindow: MainWindowGetter,
    private readonly updaterService: IUpdaterService
  ) {
    super()
  }

  public getInvokeHandlers(): UpdaterInvokeHandlers {
    return {
      checkForUpdates: async () => {
        if (!app.isPackaged) {
          // In dev mode, we might want to log or mock.
          console.log('Skipping update check in dev mode')
          return
        }
        await this.executeCommand(
          () => this.updaterService.checkForUpdates(),
          (error) => {
            console.error('[UpdaterIpcHandler] checkForUpdates failed:', error)
          }
        )
      },

      downloadUpdate: async () =>
        this.executeCommand(
          () => this.updaterService.downloadUpdate(),
          (error) => {
            console.error('[UpdaterIpcHandler] downloadUpdate failed:', error)
          }
        ),

      quitAndInstall: async () =>
        this.executeCommand(
          () => this.updaterService.quitAndInstall(),
          (error) => {
            console.error('[UpdaterIpcHandler] quitAndInstall failed:', error)
          }
        )
    }
  }

  public registerEvents(): void {
    this.updaterService.registerEvents({
      onCheckingForUpdate: () => {
        this.sendEvent(IPC_EVENT_CHANNELS.onCheckingForUpdate)
      },
      onUpdateAvailable: (info) => {
        this.sendEvent(IPC_EVENT_CHANNELS.onUpdateAvailable, info)
      },
      onUpdateNotAvailable: (info) => {
        this.sendEvent(IPC_EVENT_CHANNELS.onUpdateNotAvailable, info)
      },
      onUpdateError: (error) => {
        this.sendEvent(IPC_EVENT_CHANNELS.onUpdateError, error)
      },
      onDownloadProgress: (progress) => {
        this.sendEvent(IPC_EVENT_CHANNELS.onDownloadProgress, progress)
      },
      onUpdateDownloaded: (info) => {
        this.sendEvent(IPC_EVENT_CHANNELS.onUpdateDownloaded, info)
      }
    })
  }

  private sendEvent(channel: string, payload?: unknown): void {
    const win = this.mainWindow()
    if (!win) {
      return
    }

    if (typeof payload === 'undefined') {
      win.webContents.send(channel)
      return
    }

    win.webContents.send(channel, payload)
  }
}
