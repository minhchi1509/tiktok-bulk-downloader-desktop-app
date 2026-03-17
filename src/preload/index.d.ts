import { ElectronAPI } from '@electron-toolkit/preload'
import { IpcApi } from '@shared/types/ipc'

declare global {
  interface Window {
    api: IpcApi
    electron: ElectronAPI
  }
}
