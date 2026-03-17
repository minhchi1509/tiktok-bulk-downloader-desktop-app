import {
  IPC_EVENT_CHANNELS,
  IPC_INVOKE_CHANNELS,
  IpcApi,
  IpcEventMethod,
  IpcEventPayload,
  IpcInvokeHandlers,
  IpcInvokeMethod,
  IpcResponse
} from '@shared/types/ipc.type'
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const invokeApi: IpcInvokeHandlers = new Proxy({} as IpcInvokeHandlers, {
  get(_target, method) {
    return (...args: unknown[]) => {
      return ipcRenderer.invoke(IPC_INVOKE_CHANNELS[method as IpcInvokeMethod], ...args)
    }
  }
})

const on = <T>(channel: string, callback: (payload: T) => void): (() => void) => {
  const listener = (_event: Electron.IpcRendererEvent, payload: T) => callback(payload)
  ipcRenderer.on(channel, listener)
  return () => {
    ipcRenderer.removeListener(channel, listener)
  }
}

const onNoPayload = (channel: string, callback: () => void): (() => void) => {
  const listener = () => callback()
  ipcRenderer.on(channel, listener)
  return () => {
    ipcRenderer.removeListener(channel, listener)
  }
}

const onEvent = <K extends IpcEventMethod>(
  method: K,
  callback: IpcEventPayload<K> extends void ? () => void : (payload: IpcEventPayload<K>) => void
): (() => void) => {
  const channel = IPC_EVENT_CHANNELS[method]
  if (callback.length === 0) {
    return onNoPayload(channel, callback as () => void)
  }
  return on(channel, callback as (payload: IpcEventPayload<K>) => void)
}

// Custom APIs for renderer
const api: IpcApi = {
  ...invokeApi,

  getSettings: <T = unknown>(key: string) => {
    return invokeApi.getSettings(key) as Promise<IpcResponse<T>>
  },
  saveSettings: <T>(key: string, value: T) => {
    return invokeApi.saveSettings(key, value)
  },

  onUpdateAvailable: (callback) => {
    return onEvent('onUpdateAvailable', callback)
  },
  onUpdateDownloaded: (callback) => {
    return onEvent('onUpdateDownloaded', callback)
  },
  onDownloadProgress: (callback) => {
    return onEvent('onDownloadProgress', callback)
  },
  onUpdateError: (callback) => {
    return onEvent('onUpdateError', callback)
  },
  onCheckingForUpdate: (callback) => {
    return onEvent('onCheckingForUpdate', callback)
  },
  onUpdateNotAvailable: (callback) => {
    return onEvent('onUpdateNotAvailable', callback)
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
