import IpcHandlerOrchestrator from './ipc/ipc-handler.orchestrator'
import type { ISetupIpcHandlersOptions } from './ipc/ipc-handler.types'

const setupIpcHandlers = (options: ISetupIpcHandlersOptions) => {
  const orchestrator = new IpcHandlerOrchestrator(options)
  orchestrator.registerAll()
}

export default setupIpcHandlers
