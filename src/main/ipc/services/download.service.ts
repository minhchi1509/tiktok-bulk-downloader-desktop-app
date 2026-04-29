import { app, dialog } from 'electron'
import path from 'path'
import { pipeline } from 'stream/promises'

import { downloadClient } from '@shared/configs/download-client'
import type { IDownloadFileOptions } from '@shared/types/ipc/ipc-invoke.type'
import FileUtils from '@shared/utils/file.util'

export interface IDownloadService {
  selectFolder(): Promise<string | null>
  downloadFile(options: IDownloadFileOptions): Promise<void>
  getDefaultDownloadPath(): Promise<string>
}

export class ElectronDownloadService implements IDownloadService {
  public async selectFolder(): Promise<string | null> {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })

    if (canceled) {
      return null
    }

    return filePaths[0]
  }

  public async downloadFile(options: IDownloadFileOptions): Promise<void> {
    let filePath = ''

    try {
      const { url, fileName, folderPath, retryCount = 100 } = options
      await FileUtils.ensureDirectory(folderPath)
      filePath = path.join(folderPath, fileName)

      const normalizedRetryCount = Number.isFinite(retryCount)
        ? Math.max(0, Math.trunc(retryCount))
        : 0
      // retryCount means additional retries and does not include the first attempt.
      const totalAttempts = normalizedRetryCount + 1

      let lastError: Error | null = null
      for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
        try {
          const response = await downloadClient.get(url, {
            responseType: 'stream',
            headers: {
              // Avoid compressed transfer for binary media downloads.
              'Accept-Encoding': 'identity'
            }
          })
          const writer = FileUtils.createWriteStream(filePath, {
            highWaterMark: 1024 * 1024
          })

          await pipeline(response.data, writer)
          return
        } catch (error) {
          lastError = error as Error
          await FileUtils.deleteFile(filePath)
        }
      }

      throw lastError ?? new Error('Failed to download file')
    } catch (error) {
      await FileUtils.deleteFile(filePath)
      throw error
    }
  }

  public async getDefaultDownloadPath(): Promise<string> {
    return app.getPath('downloads')
  }
}
