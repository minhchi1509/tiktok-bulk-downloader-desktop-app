import {
  IAwemeItem,
  IAwemeListResponse,
  IGetAwemeListCursor,
  IUserInfo,
  ITiktokCredentials
} from '@shared/types/tiktok.type'

export interface IpcGetAwemeListOptions extends IGetAwemeListCursor {
  cookie: string
}

export interface IpcGetAwemeDetailsOptions {
  cookie?: string
}

export interface IDownloadFileOptions {
  url: string
  fileName: string
  folderPath: string
}

export interface IpcApi {
  getUserInfo: (username: string) => Promise<IUserInfo>
  getUserAwemeList: (secUid: string, options: IpcGetAwemeListOptions) => Promise<IAwemeListResponse>
  getAwemeDetails: (awemeId: string, options?: IpcGetAwemeDetailsOptions) => Promise<IAwemeItem>
  getCredentials: () => Promise<ITiktokCredentials>
  selectFolder: () => Promise<string | null>
  downloadFile: (options: IDownloadFileOptions) => Promise<boolean>
  getDefaultDownloadPath: () => Promise<string>

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
}
