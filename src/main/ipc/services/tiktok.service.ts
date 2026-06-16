import type { IpcInvokeArgs } from '@shared/types/ipc/ipc-invoke.type'

import { TiktokMobileApiService } from '@minhchi1509/social-media-api'
import type {
  ITiktokAwemeDetails,
  ITiktokGetAwemeListResponse,
  ITiktokUserDetails
} from '@minhchi1509/social-media-api/types'
import { IGetUserAwemeListOptions } from '@shared/types/tiktok.type'
import { ISettingsService } from '@main/ipc/services/settings.service'
import { EAppSettingKey } from '@shared/constants/enum'
import axios, { AxiosError } from 'axios'

type GetUserAwemeListArgs = IpcInvokeArgs<'getUserAwemeList'>
type GetUserInfoArgs = IpcInvokeArgs<'getUserInfo'>
type GetMultiAwemeDetailsArgs = IpcInvokeArgs<'getMultiAwemeDetails'>

export interface ITiktokService {
  getUserAwemeList(...args: GetUserAwemeListArgs): Promise<ITiktokGetAwemeListResponse>
  getUserInfo(...args: GetUserInfoArgs): Promise<ITiktokUserDetails>
  getMultiAwemeDetails(
    ...args: GetMultiAwemeDetailsArgs
  ): Promise<Record<string, ITiktokAwemeDetails | null>>
}

export class TiktokService implements ITiktokService {
  private tiktokApiService: TiktokMobileApiService | undefined

  constructor(private readonly settingsService: ISettingsService) {}

  private getTiktokMobileApiService = async (): Promise<TiktokMobileApiService> => {
    if (!this.tiktokApiService) {
      const credentials = await this.getTiktokMobileCredentials()
      this.tiktokApiService = new TiktokMobileApiService({
        credentials: {
          mobileAppCookie: credentials.cookies,
          deviceId: credentials.deviceId,
          installId: credentials.installId
        }
      })
    }
    return this.tiktokApiService
  }

  private getTiktokMobileCredentials = async () => {
    try {
      const apiKey = await this.settingsService.get<string>(EAppSettingKey.API_SECRET_KEY)

      const { data: responseData } = await axios.get(
        `${import.meta.env.MAIN_VITE_TOOL_API_URL}/tiktok/credentials`,
        {
          headers: {
            'x-api-key': apiKey || ''
          }
        }
      )
      return responseData as { cookies: string; deviceId: string; installId: string }
    } catch (error) {
      const err = error as AxiosError
      const errorData = err.response?.data
      const errorMessage = (errorData as any)?.message || err.message || 'Unknown error'
      throw new Error(errorMessage)
    }
  }

  public async getUserAwemeList(options: IGetUserAwemeListOptions) {
    const { secUid, maxCursor, minCursor } = options
    const tiktokMobileApiService = await this.getTiktokMobileApiService()
    const responseData = await tiktokMobileApiService.getUserAwemeList(
      {
        secUid,
        maxCursor,
        minCursor
      },
      { maxRetries: 15, retryDelayMs: 1000 }
    )
    return responseData
  }

  public async getUserInfo(username: string) {
    const tiktokMobileApiService = await this.getTiktokMobileApiService()
    const responseData = await tiktokMobileApiService.getProfileDetails(username)
    return responseData
  }

  public async getMultiAwemeDetails(awemeIds: string[]) {
    const tiktokMobileApiService = await this.getTiktokMobileApiService()
    const responseData = await tiktokMobileApiService.getMultipleAwemeDetails(awemeIds)
    return responseData
  }
}
