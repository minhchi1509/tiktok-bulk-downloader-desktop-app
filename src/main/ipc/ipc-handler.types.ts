import type { BrowserWindow } from 'electron'

import type { IpcInvokeHandlers } from '@shared/types/ipc/ipc-invoke.type'

export interface ISetupIpcHandlersOptions {
  mainWindow: () => BrowserWindow | null
}

export interface IIpcDomainHandler {
  getInvokeHandlers(): Partial<IpcInvokeHandlers>
  registerEvents?(): void
}
