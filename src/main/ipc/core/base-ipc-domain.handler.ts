import type { IpcResponse, IpcInvokeHandlers } from '@shared/types/ipc/ipc-invoke.type'

import type { IIpcDomainHandler } from '../ipc-handler.types'

export abstract class BaseIpcDomainHandler implements IIpcDomainHandler {
  public abstract getInvokeHandlers(): Partial<IpcInvokeHandlers>

  public registerEvents?(): void

  protected async executeQuery<T>(
    query: () => Promise<T>,
    fallbackMessage?: string
  ): Promise<IpcResponse<T>> {
    try {
      const data = await query()
      return {
        success: true,
        data
      }
    } catch (error) {
      return {
        success: false,
        error: fallbackMessage ?? this.toErrorMessage(error)
      }
    }
  }

  protected async executeCommand(
    command: () => Promise<unknown>,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      await command()
    } catch (error) {
      onError?.(this.toError(error))
    }
  }

  protected toErrorMessage(error: unknown): string {
    return this.toError(error).message
  }

  protected toError(error: unknown): Error {
    return error instanceof Error ? error : new Error('Unknown error')
  }
}
