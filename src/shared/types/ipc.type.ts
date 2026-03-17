import {
  IAwemeDetails,
  IAwemeListResponse,
  IGetAwemeListCursor,
  IUserInfo
} from '@shared/types/tiktok.type'
import type { ProgressInfo, UpdateDownloadedEvent, UpdateInfo } from 'electron-updater'

export interface IpcGetAwemeListOptions extends IGetAwemeListCursor {
  cookie?: string
}

export interface IpcGetAwemeDetailsOptions {
  cookie?: string
}

export interface IDownloadFileOptions {
  url: string
  fileName: string
  folderPath: string
}

export type IpcResponse<T> =
  | {
      success: true
      data: T
      error?: never
    }
  | {
      success: false
      error: string
      data?: never
    }

type Rpc<Args extends unknown[] = [], Response = void> = {
  args: Args
  response: Response
}

// Single source of truth for all ipcRenderer.invoke/ipcMain.handle methods.
export interface IpcInvokeContract {
  getUserInfo: Rpc<[username: string, options?: IpcGetAwemeDetailsOptions], IpcResponse<IUserInfo>>
  getUserAwemeList: Rpc<
    [secUid: string, options?: IpcGetAwemeListOptions],
    IpcResponse<IAwemeListResponse>
  >
  getMultiAwemeDetails: Rpc<
    [awemeIds: string[], options?: IpcGetAwemeDetailsOptions],
    IpcResponse<Record<string, IAwemeDetails>>
  >
  selectFolder: Rpc<[], IpcResponse<string | null>>
  downloadFile: Rpc<[options: IDownloadFileOptions], IpcResponse<boolean>>
  getDefaultDownloadPath: Rpc<[], IpcResponse<string>>
  getSettings: Rpc<[key: string], IpcResponse<unknown>>
  saveSettings: Rpc<[key: string, value: unknown], void>
  checkForUpdates: Rpc<[], void>
  downloadUpdate: Rpc<[], void>
  quitAndInstall: Rpc<[], void>
}

export type IpcInvokeMethod = keyof IpcInvokeContract
export type IpcInvokeArgs<K extends IpcInvokeMethod> = IpcInvokeContract[K]['args']
export type IpcInvokeResponse<K extends IpcInvokeMethod> = IpcInvokeContract[K]['response']

export type IpcInvokeHandlers = {
  [K in IpcInvokeMethod]: (...args: IpcInvokeArgs<K>) => Promise<IpcInvokeResponse<K>>
}

export const IPC_INVOKE_CHANNELS: { [K in IpcInvokeMethod]: string } = {
  getUserInfo: 'GET_USER_INFO',
  getUserAwemeList: 'GET_USER_AWEME_LIST',
  getMultiAwemeDetails: 'GET_MULTI_AWEME_DETAILS',
  selectFolder: 'SELECT_FOLDER',
  downloadFile: 'DOWNLOAD_FILE',
  getDefaultDownloadPath: 'GET_DEFAULT_DOWNLOAD_PATH',
  getSettings: 'GET_SETTINGS',
  saveSettings: 'SAVE_SETTINGS',
  checkForUpdates: 'CHECK_FOR_UPDATES',
  downloadUpdate: 'DOWNLOAD_UPDATE',
  quitAndInstall: 'QUIT_AND_INSTALL'
}

type EventUnsubscribe = () => void

export type UpdateAvailableInfo = UpdateInfo
export type UpdateDownloadedInfo = UpdateDownloadedEvent
export type DownloadProgressInfo = ProgressInfo
export type UpdateErrorInfo = Error

type Event<P = void> = {
  payload: P
}

export interface IpcEventContract {
  onUpdateAvailable: Event<UpdateAvailableInfo>
  onUpdateDownloaded: Event<UpdateDownloadedInfo>
  onDownloadProgress: Event<DownloadProgressInfo>
  onUpdateError: Event<UpdateErrorInfo>
  onCheckingForUpdate: Event<void>
  onUpdateNotAvailable: Event<void>
}

export type IpcEventMethod = keyof IpcEventContract
export type IpcEventPayload<K extends IpcEventMethod> = IpcEventContract[K]['payload']

export const IPC_EVENT_CHANNELS: { [K in IpcEventMethod]: string } = {
  onUpdateAvailable: 'UPDATE_AVAILABLE',
  onUpdateDownloaded: 'UPDATE_DOWNLOADED',
  onDownloadProgress: 'DOWNLOAD_PROGRESS',
  onUpdateError: 'UPDATE_ERROR',
  onCheckingForUpdate: 'CHECKING_FOR_UPDATE',
  onUpdateNotAvailable: 'UPDATE_NOT_AVAILABLE'
}

type IpcEventApi = {
  [K in IpcEventMethod]: IpcEventPayload<K> extends void
    ? (callback: () => void) => EventUnsubscribe
    : (callback: (payload: IpcEventPayload<K>) => void) => EventUnsubscribe
}

export interface IpcApi
  extends Omit<IpcInvokeHandlers, 'getSettings' | 'saveSettings'>, IpcEventApi {
  getSettings: <T = unknown>(key: string) => Promise<IpcResponse<T>>
  saveSettings: <T>(key: string, value: T) => Promise<void>
}
