import { ipcMain, dialog, app, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { pipeline } from 'stream/promises'
import { autoUpdater } from 'electron-updater'

import { IPC_EVENT_CHANNELS } from '@shared/types/ipc/ipc-event.type'
import TiktokService from '@shared/services/tiktok.service'
import {
  IpcInvokeHandlers,
  IPC_INVOKE_CHANNELS,
  IpcInvokeMethod
} from '@shared/types/ipc/ipc-invoke.type'

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

interface ISetupIpcHandlersOptions {
  mainWindow: () => BrowserWindow | null
}

const registerInvokeHandlers = (handlers: IpcInvokeHandlers) => {
  for (const method of Object.keys(IPC_INVOKE_CHANNELS) as IpcInvokeMethod[]) {
    ipcMain.handle(IPC_INVOKE_CHANNELS[method], (_event, ...args) => {
      const handler = handlers[method] as (...handlerArgs: unknown[]) => Promise<unknown>
      return handler(...args)
    })
  }
}

const setupIpcHandlers = ({ mainWindow }: ISetupIpcHandlersOptions) => {
  // Settings handlers share the same file path.
  const settingsPath = path.join(app.getPath('userData'), 'settings.json')

  const invokeHandlers: IpcInvokeHandlers = {
    getUserAwemeList: async (secUid, options) => {
      try {
        const data = await TiktokService.getUserAwemeList(secUid, options)
        return {
          success: true,
          data
        }
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message
        }
      }
    },

    getUserInfo: async (username, options) => {
      try {
        const userInfo = await TiktokService.getUserInfoByUsername(username, options)
        return {
          success: true,
          data: userInfo
        }
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message
        }
      }
    },

    getMultiAwemeDetails: async (awemeIds, options) => {
      try {
        const awemeDetails = await TiktokService.getMultiAwemeDetails(awemeIds, options)
        return {
          success: true,
          data: awemeDetails
        }
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message
        }
      }
    },

    selectFolder: async () => {
      try {
        const { canceled, filePaths } = await dialog.showOpenDialog({
          properties: ['openDirectory']
        })
        if (canceled) {
          return { success: true, data: null }
        }
        return { success: true, data: filePaths[0] }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    },

    downloadFile: async (options) => {
      try {
        const { url, fileName, folderPath } = options
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true })
        }
        const filePath = path.join(folderPath, fileName)

        const response = await axios.get(url, { responseType: 'stream' })
        const writer = fs.createWriteStream(filePath)

        await pipeline(response.data, writer)
        return { success: true, data: true }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    },

    getDefaultDownloadPath: async () => {
      return { success: true, data: app.getPath('downloads') }
    },

    getSettings: async (key) => {
      try {
        if (fs.existsSync(settingsPath)) {
          const data = fs.readFileSync(settingsPath, 'utf-8')
          const settings = JSON.parse(data) as Record<string, unknown>
          return {
            success: true,
            data: settings[key]
          }
        }
      } catch (error) {
        return { success: false, error: 'Failed to read settings' }
      }
      return { success: true, data: null }
    },

    saveSettings: async (key, value) => {
      try {
        let settings: Record<string, unknown> = {}
        if (fs.existsSync(settingsPath)) {
          const data = fs.readFileSync(settingsPath, 'utf-8')
          settings = JSON.parse(data) as Record<string, unknown>
        }
        settings[key] = value
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
      } catch (error) {
        console.error('Error saving settings:', error)
      }
    },

    checkForUpdates: async () => {
      if (!app.isPackaged) {
        // In dev mode, we might want to log or mock.
        console.log('Skipping update check in dev mode')
        return
      }
      await autoUpdater.checkForUpdatesAndNotify()
    },

    downloadUpdate: async () => {
      await autoUpdater.downloadUpdate()
    },

    quitAndInstall: async () => {
      autoUpdater.quitAndInstall(false, true)
    }
  }

  registerInvokeHandlers(invokeHandlers)

  // Auto Updater Events
  autoUpdater.on('checking-for-update', () => {
    const win = mainWindow()
    win?.webContents.send(IPC_EVENT_CHANNELS.onCheckingForUpdate)
  })

  autoUpdater.on('update-available', (info) => {
    const win = mainWindow()
    win?.webContents.send(IPC_EVENT_CHANNELS.onUpdateAvailable, info)
  })

  autoUpdater.on('update-not-available', () => {
    const win = mainWindow()
    win?.webContents.send(IPC_EVENT_CHANNELS.onUpdateNotAvailable)
  })

  autoUpdater.on('error', (err) => {
    const win = mainWindow()
    win?.webContents.send(IPC_EVENT_CHANNELS.onUpdateError, err)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    const win = mainWindow()
    win?.webContents.send(IPC_EVENT_CHANNELS.onDownloadProgress, progressObj)
  })

  autoUpdater.on('update-downloaded', (info) => {
    const win = mainWindow()
    win?.webContents.send(IPC_EVENT_CHANNELS.onUpdateDownloaded, info)
  })
}

export default setupIpcHandlers
