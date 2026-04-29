import {
  DownloadProgressInfo,
  UpdateAvailableInfo,
  UpdateDownloadedInfo,
  UpdateErrorInfo,
  UpdateNotAvailableInfo
} from '@shared/types/ipc/ipc-event.type'
import { autoUpdater } from 'electron-updater'

export interface IUpdaterEventCallbacks {
  onCheckingForUpdate: () => void
  onUpdateAvailable: (info: UpdateAvailableInfo) => void
  onUpdateNotAvailable: (info: UpdateNotAvailableInfo) => void
  onUpdateError: (error: UpdateErrorInfo) => void
  onDownloadProgress: (progress: DownloadProgressInfo) => void
  onUpdateDownloaded: (info: UpdateDownloadedInfo) => void
}

export interface IUpdaterService {
  checkForUpdates(): Promise<void>
  downloadUpdate(): Promise<void>
  quitAndInstall(): Promise<void>
  registerEvents(callbacks: IUpdaterEventCallbacks): void
}

export class ElectronUpdaterService implements IUpdaterService {
  private eventsRegistered = false

  constructor(private readonly updater: typeof autoUpdater = autoUpdater) {
    this.updater.autoDownload = false
    this.updater.autoInstallOnAppQuit = true
  }

  public async checkForUpdates(): Promise<void> {
    await this.updater.checkForUpdatesAndNotify()
  }

  public async downloadUpdate(): Promise<void> {
    await this.updater.downloadUpdate()
  }

  public async quitAndInstall(): Promise<void> {
    this.updater.quitAndInstall(false, true)
  }

  public registerEvents(callbacks: IUpdaterEventCallbacks): void {
    if (this.eventsRegistered) {
      return
    }

    this.updater.on('checking-for-update', () => {
      callbacks.onCheckingForUpdate()
    })

    this.updater.on('update-available', (info) => {
      callbacks.onUpdateAvailable(info)
    })

    this.updater.on('update-not-available', (info) => {
      callbacks.onUpdateNotAvailable(info)
    })

    this.updater.on('error', (error) => {
      callbacks.onUpdateError(error)
    })

    this.updater.on('download-progress', (progress) => {
      callbacks.onDownloadProgress(progress)
    })

    this.updater.on('update-downloaded', (info) => {
      callbacks.onUpdateDownloaded(info)
    })

    this.eventsRegistered = true
  }
}
