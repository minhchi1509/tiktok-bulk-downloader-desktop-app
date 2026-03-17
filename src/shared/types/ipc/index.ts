import { IpcEventApi } from '@shared/types/ipc/ipc-event.type'
import { IpcInvokeHandlers, IpcResponse } from '@shared/types/ipc/ipc-invoke.type'

export interface IpcApi
  extends Omit<IpcInvokeHandlers, 'getSettings' | 'saveSettings'>, IpcEventApi {
  getSettings: <T = unknown>(key: string) => Promise<IpcResponse<T>>
  saveSettings: <T>(key: string, value: T) => Promise<void>
}
