import { IpcApi } from '@shared/types/ipc.type'
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_CHANNELS } from '@shared/constants'

// Custom APIs for renderer
const api: IpcApi = {
  getUserInfo: (username) => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_USER_INFO, username)
  },
  getUserAwemeList: (secUid, options) => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_USER_AWEME_LIST, secUid, options)
  },
  getAwemeDetails: (awemeId, options) => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_AWEME_DETAILS, awemeId, options)
  },
  selectFolder: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.SELECT_FOLDER)
  },
  downloadFile: (options) => {
    return ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_FILE, options)
  },
  getDefaultDownloadPath: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_DEFAULT_DOWNLOAD_PATH)
  },

  getSettings: (key: string) => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS, key)
  },
  saveSettings: (key: string, value: string) => {
    return ipcRenderer.invoke(IPC_CHANNELS.SAVE_SETTINGS, key, value)
  },

  // Auto Updater
  checkForUpdates: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.CHECK_FOR_UPDATES)
  },
  downloadUpdate: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_UPDATE)
  },
  quitAndInstall: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.QUIT_AND_INSTALL)
  },
  onUpdateAvailable: (callback) => {
    ipcRenderer.on(IPC_CHANNELS.UPDATE_AVAILABLE, (_event, info) => callback(info))
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on(IPC_CHANNELS.UPDATE_DOWNLOADED, (_event, info) => callback(info))
  },
  onDownloadProgress: (callback) => {
    ipcRenderer.on(IPC_CHANNELS.DOWNLOAD_PROGRESS, (_event, progress) => callback(progress))
  },
  onUpdateError: (callback) => {
    ipcRenderer.on(IPC_CHANNELS.UPDATE_ERROR, (_event, error) => callback(error))
  },
  onCheckingForUpdate: (callback) => {
    ipcRenderer.on(IPC_CHANNELS.CHECKING_FOR_UPDATE, () => callback())
  },
  onUpdateNotAvailable: (callback) => {
    ipcRenderer.on(IPC_CHANNELS.UPDATE_NOT_AVAILABLE, () => callback())
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
