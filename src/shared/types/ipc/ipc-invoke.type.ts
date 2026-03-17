import {
  IAwemeDetails,
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

export type IpcInvokeMethod = keyof IpcInvokeContract
export type IpcInvokeArgs<K extends IpcInvokeMethod> = IpcInvokeContract[K]['args']
export type IpcInvokeResponse<K extends IpcInvokeMethod> = IpcInvokeContract[K]['response']

export type IpcInvokeHandlers = {
  [K in IpcInvokeMethod]: (...args: IpcInvokeArgs<K>) => Promise<IpcInvokeResponse<K>>
}
