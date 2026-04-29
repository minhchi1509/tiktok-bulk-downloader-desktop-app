import { ipcMain } from 'electron'

import {
  IPC_INVOKE_CHANNELS,
  IpcInvokeHandlers,
  IpcInvokeMethod
} from '@shared/types/ipc/ipc-invoke.type'

export const registerInvokeHandlers = (handlers: IpcInvokeHandlers): void => {
  for (const method of Object.keys(IPC_INVOKE_CHANNELS) as IpcInvokeMethod[]) {
    ipcMain.handle(IPC_INVOKE_CHANNELS[method], (_event, ...args) => {
      const handler = handlers[method] as (...handlerArgs: unknown[]) => Promise<unknown>
      return handler(...args)
    })
  }
}
