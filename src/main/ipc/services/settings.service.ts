import { app } from 'electron'
import fs from 'fs'
import path from 'path'

export interface ISettingsService {
  get<T = unknown>(key: string): Promise<T | null>
  set(key: string, value: unknown): Promise<void>
}

export class JsonSettingsService implements ISettingsService {
  private readonly settingsPath: string

  constructor(settingsPath: string = path.join(app.getPath('userData'), 'settings.json')) {
    this.settingsPath = settingsPath
  }

  public async get<T = unknown>(key: string): Promise<T | null> {
    const settings = this.readSettings()
    return (settings[key] as T | undefined) ?? null
  }

  public async set(key: string, value: unknown): Promise<void> {
    const settings = this.readSettings()
    settings[key] = value

    fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2))
  }

  private readSettings(): Record<string, unknown> {
    if (!fs.existsSync(this.settingsPath)) {
      return {}
    }

    const data = fs.readFileSync(this.settingsPath, 'utf-8')
    return JSON.parse(data) as Record<string, unknown>
  }
}
