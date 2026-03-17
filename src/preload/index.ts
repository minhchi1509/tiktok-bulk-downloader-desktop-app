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

const createIpcProxy = <T extends object>(
  resolver: (method: string) => (...args: unknown[]) => unknown
): T => {
  return new Proxy({} as object, {
    get(_target, method) {
      return resolver(String(method))
    }
  }) as T
}

const invokeApi = createIpcProxy<IpcInvokeHandlers>((method) => {
  return (...args: unknown[]) => {
    return ipcRenderer.invoke(IPC_INVOKE_CHANNELS[method as IpcInvokeMethod], ...args)
  }
})

const eventApi = createIpcProxy<IpcEventApi>((method) => {
  return (...args: unknown[]) => {
    const callback = args[0] as (...callbackArgs: unknown[]) => void
    const eventMethod = method as IpcEventMethod
    const channel = IPC_EVENT_CHANNELS[eventMethod]
    const listener = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
      callback(...args)
    }

    ipcRenderer.on(channel, listener)

    return () => {
      ipcRenderer.removeListener(channel, listener)
    }
  }
})

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
