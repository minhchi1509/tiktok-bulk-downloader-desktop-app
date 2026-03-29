import fs from 'fs'

class FileUtils {
  static async ensureDirectory(folderPath: string): Promise<void> {
    await fs.promises.mkdir(folderPath, { recursive: true })
  }

  static createWriteStream(
    filePath: string,
    options?: Parameters<typeof fs.createWriteStream>[1]
  ): fs.WriteStream {
    return fs.createWriteStream(filePath, options)
  }

  static async deleteFile(filePath: string): Promise<void> {
    if (!filePath) {
      return
    }

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath).catch(() => undefined)
    }
  }
}

export default FileUtils
