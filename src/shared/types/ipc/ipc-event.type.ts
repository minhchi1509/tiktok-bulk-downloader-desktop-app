import type { ProgressInfo, UpdateDownloadedEvent, UpdateInfo } from 'electron-updater'

export type UpdateAvailableInfo = UpdateInfo
export type UpdateNotAvailableInfo = UpdateInfo
export type UpdateDownloadedInfo = UpdateDownloadedEvent
export type DownloadProgressInfo = ProgressInfo
export type UpdateErrorInfo = Error

export interface IpcEventContract {
  onUpdateAvailable: UpdateAvailableInfo
  onUpdateDownloaded: UpdateDownloadedInfo
  onDownloadProgress: DownloadProgressInfo
  onUpdateError: UpdateErrorInfo
  onUpdateNotAvailable: UpdateNotAvailableInfo

  onCheckingForUpdate: void
}

export const IPC_EVENT_CHANNELS: { [K in IpcEventMethod]: string } = {
  onUpdateAvailable: 'UPDATE_AVAILABLE',
  onUpdateDownloaded: 'UPDATE_DOWNLOADED',
  onDownloadProgress: 'DOWNLOAD_PROGRESS',
  onUpdateError: 'UPDATE_ERROR',
  onCheckingForUpdate: 'CHECKING_FOR_UPDATE',
  onUpdateNotAvailable: 'UPDATE_NOT_AVAILABLE'
}

export type IpcEventMethod = keyof IpcEventContract
export type IpcEventPayload<K extends IpcEventMethod> = IpcEventContract[K]
type EventUnsubscribe = () => void

export type IpcEventApi = {
  [K in IpcEventMethod]: IpcEventPayload<K> extends void
    ? (callback: () => void) => EventUnsubscribe
    : (callback: (payload: IpcEventPayload<K>) => void) => EventUnsubscribe
}
