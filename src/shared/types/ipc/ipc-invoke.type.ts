import type {
  ITiktokAwemeDetails,
  ITiktokGetAwemeListResponse,
  ITiktokUserDetails
} from '@minhchi1509/social-media-api/types'
import { TGetAwemeListOptions } from '@shared/types/tiktok.type'
export interface IDownloadFileOptions {
  url: string
  fileName: string
  folderPath: string
  retryCount?: number
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
  getUserInfo: Rpc<[username: string], IpcResponse<ITiktokUserDetails>>
  getUserAwemeList: Rpc<[options: TGetAwemeListOptions], IpcResponse<ITiktokGetAwemeListResponse>>
  getMultiAwemeDetails: Rpc<
    [awemeIds: string[]],
    IpcResponse<Record<string, ITiktokAwemeDetails | null>>
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
