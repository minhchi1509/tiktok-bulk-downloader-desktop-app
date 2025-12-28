import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import setupIpcHandlers from './ipc-handler'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    resizable: true,
    title: 'Tiktok Bulk Downloader',
    icon: join(__dirname, '../../resources/icon.png'),

    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.maximize()
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

const initializeServices = async () => {
  // Setup IPC handlers
  setupIpcHandlers({
    mainWindow: () => mainWindow
  })

  console.log('✅✅✅ [Main] Services initialized')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  await initializeServices()
  electronApp.setAppUserModelId('com.minhchi1509.toptop-bulk-downloader')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Cleanup on quit
app.on('before-quit', async () => {
  console.log('🧹🧹🧹[Main] Cleaning up before quit...')
  // Perform any necessary cleanup here
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌❌❌ [Main] Uncaught exception:', error)
})

process.on('unhandledRejection', (reason) => {
  console.error('❌❌❌ [Main] Unhandled rejection:', reason)
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
