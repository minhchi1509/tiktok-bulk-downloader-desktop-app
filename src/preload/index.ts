import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IpcEventMethod, IpcEventApi, IPC_EVENT_CHANNELS } from '@shared/types/ipc/ipc-event.type'
import {
  IpcInvokeHandlers,
  IPC_INVOKE_CHANNELS,
  IpcInvokeMethod,
  IpcResponse
} from '@shared/types/ipc/ipc-invoke.type'
import { IpcApi } from '@shared/types/ipc'

const invokeApi = Object.fromEntries(
  (Object.keys(IPC_INVOKE_CHANNELS) as IpcInvokeMethod[]).map((method) => [
    method,
    (...args: unknown[]) => ipcRenderer.invoke(IPC_INVOKE_CHANNELS[method], ...args)
  ])
) as IpcInvokeHandlers

const eventApi = Object.fromEntries(
  (Object.keys(IPC_EVENT_CHANNELS) as IpcEventMethod[]).map((method) => [
    method,
    (callback: (...callbackArgs: unknown[]) => void) => {
      const channel = IPC_EVENT_CHANNELS[method]
      const listener = (_event: Electron.IpcRendererEvent, ...eventArgs: unknown[]) => {
        callback(...eventArgs)
      }

      ipcRenderer.on(channel, listener)

      return () => {
        ipcRenderer.removeListener(channel, listener)
      }
    }
  ])
) as IpcEventApi

// Custom APIs for renderer
const api: IpcApi = {
  ...invokeApi,
  ...eventApi,

  getSettings: <T = unknown>(key: string) => {
    return invokeApi.getSettings(key) as Promise<IpcResponse<T>>
  },
  saveSettings: <T>(key: string, value: T) => {
    return invokeApi.saveSettings(key, value)
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
