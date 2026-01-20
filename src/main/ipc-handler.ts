import { IPC_CHANNELS } from '@shared/constants'
import TiktokService from '@shared/services/tiktok.service'
import {
  IDownloadFileOptions,
  IpcGetAwemeDetailsOptions,
  IpcGetAwemeListOptions,
  IpcResponse
} from '@shared/types/ipc.type'
import {
  IAwemeItem,
  IAwemeListResponse,
  ITiktokCredentials,
  IUserInfo
} from '@shared/types/tiktok.type'
import { ipcMain, dialog, app, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { pipeline } from 'stream/promises'
import { autoUpdater } from 'electron-updater'

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

interface ISetupIpcHandlersOptions {
  mainWindow: () => BrowserWindow | null
}

const setupIpcHandlers = ({ mainWindow }: ISetupIpcHandlersOptions) => {
  ipcMain.handle(
    IPC_CHANNELS.GET_USER_AWEME_LIST,
    async (
      _event,
      secUid: string,
      options: IpcGetAwemeListOptions
    ): Promise<IpcResponse<IAwemeListResponse>> => {
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
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GET_USER_INFO,
    async (
      _event,
      username: string,
      options: IpcGetAwemeDetailsOptions
    ): Promise<IpcResponse<IUserInfo>> => {
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
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GET_AWEME_DETAILS,
    async (_event, awemeUrl: string): Promise<IpcResponse<IAwemeItem>> => {
      try {
        const awemeDetails = await TiktokService.getAwemeDetails(awemeUrl)
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
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GET_TIKTOK_CREDENTIALS,
    async (): Promise<IpcResponse<ITiktokCredentials>> => {
      try {
        const credentials = await TiktokService.getCredentials()
        return {
          success: true,
          data: credentials
        }
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message
        }
      }
    }
  )

  ipcMain.handle(IPC_CHANNELS.SELECT_FOLDER, async (): Promise<IpcResponse<string | null>> => {
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
  })

  ipcMain.handle(
    IPC_CHANNELS.DOWNLOAD_FILE,
    async (_event, options: IDownloadFileOptions): Promise<IpcResponse<boolean>> => {
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
    }
  )

  ipcMain.handle(IPC_CHANNELS.GET_DEFAULT_DOWNLOAD_PATH, async (): Promise<IpcResponse<string>> => {
    return { success: true, data: app.getPath('downloads') }
  })

  // Settings Handlers
  const settingsPath = path.join(app.getPath('userData'), 'settings.json')

  ipcMain.handle(
    IPC_CHANNELS.GET_SETTINGS,
    async (_event, key: string): Promise<IpcResponse<any>> => {
      try {
        if (fs.existsSync(settingsPath)) {
          const data = fs.readFileSync(settingsPath, 'utf-8')
          const settings = JSON.parse(data)
          return {
            success: true,
            data: settings[key]
          }
        }
      } catch (error) {
        return { success: false, error: 'Failed to read settings' }
      }
      return { success: true, data: null }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.SAVE_SETTINGS,
    async (_event, key: string, value: any): Promise<void> => {
      try {
        let settings = {}
        if (fs.existsSync(settingsPath)) {
          const data = fs.readFileSync(settingsPath, 'utf-8')
          settings = JSON.parse(data)
        }
        settings[key] = value
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
      } catch (error) {
        console.error('Error saving settings:', error)
      }
    }
  )

  // Auto Updater Handlers
  ipcMain.handle(IPC_CHANNELS.CHECK_FOR_UPDATES, async () => {
    if (!app.isPackaged) {
      // In dev mode, we might want to log or mock
      console.log('Skipping update check in dev mode')
      return
    }
    return autoUpdater.checkForUpdatesAndNotify()
  })

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_UPDATE, async () => {
    return autoUpdater.downloadUpdate()
  })

  ipcMain.handle(IPC_CHANNELS.QUIT_AND_INSTALL, async () => {
    autoUpdater.quitAndInstall(false, true)
  })

  // Auto Updater Events
  autoUpdater.on('checking-for-update', () => {
    const win = mainWindow()
    win?.webContents.send(IPC_CHANNELS.CHECKING_FOR_UPDATE)
  })

  autoUpdater.on('update-available', (info) => {
    const win = mainWindow()
    win?.webContents.send(IPC_CHANNELS.UPDATE_AVAILABLE, info)
  })

  autoUpdater.on('update-not-available', () => {
    const win = mainWindow()
    win?.webContents.send(IPC_CHANNELS.UPDATE_NOT_AVAILABLE)
  })

  autoUpdater.on('error', (err) => {
    const win = mainWindow()
    win?.webContents.send(IPC_CHANNELS.UPDATE_ERROR, err)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    const win = mainWindow()
    win?.webContents.send(IPC_CHANNELS.DOWNLOAD_PROGRESS, progressObj)
  })

  autoUpdater.on('update-downloaded', (info) => {
    const win = mainWindow()
    win?.webContents.send(IPC_CHANNELS.UPDATE_DOWNLOADED, info)
  })
}

export default setupIpcHandlers
