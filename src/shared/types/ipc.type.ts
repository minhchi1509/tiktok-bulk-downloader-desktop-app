import {
  IAwemeItem,
  IAwemeListResponse,
  IGetAwemeListCursor,
  IUserInfo
} from '@shared/types/tiktok.type'

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

export interface IpcApi {
  getUserInfo: (username: string) => Promise<IpcResponse<IUserInfo>>
  getUserAwemeList: (
    secUid: string,
    options: IpcGetAwemeListOptions
  ) => Promise<IpcResponse<IAwemeListResponse>>
  getAwemeDetails: (
    awemeId: string,
    options?: IpcGetAwemeDetailsOptions
  ) => Promise<IpcResponse<IAwemeItem>>
  selectFolder: () => Promise<IpcResponse<string | null>>
  downloadFile: (options: IDownloadFileOptions) => Promise<IpcResponse<boolean>>
  getDefaultDownloadPath: () => Promise<IpcResponse<string>>

  // Auto Updater
  checkForUpdates: () => Promise<void>
  downloadUpdate: () => Promise<void>
  quitAndInstall: () => Promise<void>
  onUpdateAvailable: (callback: (info: any) => void) => void
  onUpdateDownloaded: (callback: (info: any) => void) => void
  onDownloadProgress: (callback: (progress: any) => void) => void
  onUpdateError: (callback: (error: any) => void) => void
  onCheckingForUpdate: (callback: () => void) => void
  onUpdateNotAvailable: (callback: () => void) => void

  // Settings
  getSettings: (key: string) => Promise<any>
  saveSettings: (key: string, value: any) => Promise<void>
}
