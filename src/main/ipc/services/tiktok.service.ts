import type { IpcInvokeArgs } from '@shared/types/ipc/ipc-invoke.type'

import { TiktokMobileApiService } from '@minhchi1509/social-media-api'
import type {
  ITiktokAwemeDetails,
  ITiktokGetAwemeListResponse,
  ITiktokUserDetails
} from '@minhchi1509/social-media-api/types'
import { TGetAwemeListOptions } from '@shared/types/tiktok.type'
import { ISettingsService } from '@main/ipc/services/settings.service'
import { EAppSettingKey } from '@shared/constants/enum'

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
  private tiktokApiService: TiktokMobileApiService

  constructor(private readonly settingsService: ISettingsService) {
    this.tiktokApiService = new TiktokMobileApiService({
      getCredentialsBeforeRequest: async () => {
        const savedCookie = await this.settingsService.get<string>(EAppSettingKey.TIKTOK_COOKIE)
        return {
          mobileAppCookie: savedCookie || '',
          deviceId: '7631568362263561749',
          installId: '7631570938534954772'
        }
      }
    })
  }

  public async getUserAwemeList(options: TGetAwemeListOptions) {
    const { secUid, maxCursor, minCursor } = options
    const responseData = await this.tiktokApiService.getUserAwemeList({
      secUid,
      maxCursor,
      minCursor
    })
    return responseData
  }

  public async getUserInfo(username: string) {
    const responseData = await this.tiktokApiService.getProfileDetails(username)
    return responseData
  }

  public async getMultiAwemeDetails(awemeIds: string[]) {
    const responseData = await this.tiktokApiService.getMultipleAwemeDetails(awemeIds)
    return responseData
  }
}
