import { DEFAULT_USER_AGENT, TIKTOK_API_URL } from '@shared/constants'
import { IpcGetAwemeListOptions, IpcGetAwemeDetailsOptions } from '@shared/types/ipc.type'
import { IUserInfo, IAwemeListResponse, IAwemeDetails } from '@shared/types/tiktok.type'
import tiktokUtils from '@shared/utils/tiktok.util'
import axios from 'axios'

const getUserInfoByUsername = async (
  username: string,
  options?: IpcGetAwemeDetailsOptions
): Promise<IUserInfo> => {
  try {
    const { cookie } = options || {}
    const { data: rawResponse } = await axios.get(`https://www.tiktok.com/@${username}`, {
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36'
      }
    })

    const regex = /(?<="webapp\.user-detail":)[\s\S]*?(?=,"webapp\.a-b")/

    const result = rawResponse.match(regex)
    if (!result || result.length === 0) {
      throw new Error('User data not found in the page')
    }

    const userDataString = result[0]
    const userData = JSON.parse(userDataString)
    const userInfo = userData.userInfo?.user
    const userStat = userData.userInfo?.stats

    return {
      id: userInfo.id,
      uniqueId: userInfo.uniqueId,
      secUid: userInfo.secUid,
      followerCount: userStat.followerCount,
      followingCount: userStat.followingCount,
      avatarUri: userInfo.avatarLarger || userInfo.avatarMedium || userInfo.avatarThumb || ''
    }
  } catch (error) {
    throw new Error('Failed to fetch user info')
  }
}

const getUserAwemeList = async (
  secUid: string,
  options?: IpcGetAwemeListOptions
): Promise<IAwemeListResponse> => {
  try {
    const { maxCursor = '0', cursor = '0', cookie } = options || {}
    const baseParams = tiktokUtils.getBaseMobileParams()
    const params = {
      ...baseParams,
      source: '0',
      max_cursor: maxCursor,
      cursor,
      sec_user_id: secUid,
      count: '21',
      filter_private: '1',
      lite_flow_schedule: 'new',
      cdn_cache_is_login: '1',
      cdn_cache_strategy: 'v0',
      data_saver_type: '1',
      data_saver_work: 'false',
      page_type: '2'
    }

    const headers: Record<string, string> = {
      'User-Agent': DEFAULT_USER_AGENT,
      'x-tt-ttnet-origin-host': 'api22-normal-c-alisg.tiktokv.com',
      Host: 'aggr22-normal-alisg.tiktokv.com',
      ...(cookie && { Cookie: cookie })
    }

    const { data: responseData } = await axios.get(TIKTOK_API_URL.GET_USER_AWEME_LIST, {
      params,
      headers,
      paramsSerializer: (p) => new URLSearchParams(p).toString()
    })
    const hasMore = responseData.has_more === 1
    const awemeList = responseData.aweme_list || []
    const pagination = {
      cursor: responseData.min_cursor?.toString() || '',
      maxCursor: responseData.max_cursor?.toString() || '',
      hasMore
    }
    const formattedAwemeList = awemeList
      .map((item: any) => tiktokUtils.formatAwemeItemResponse(item))
      .filter((item: IAwemeDetails | null): item is IAwemeDetails => item !== null)

    return {
      awemeList: formattedAwemeList,
      pagination
    }
  } catch (error) {
    throw new Error('Failed to fetch user aweme list')
  }
}

const getMultiAwemeDetails = async (
  listAwemeIds: string[],
  options?: IpcGetAwemeDetailsOptions
): Promise<Record<string, IAwemeDetails>> => {
  try {
    const { cookie } = options || {}
    const baseParams = tiktokUtils.getBaseMobileParams()
    const formattedDetails: Record<string, IAwemeDetails> = {}
    const uniqueAwemeIds = Array.from(new Set(listAwemeIds))
    const MAX_BATCH_SIZE = 10
    const MAX_RETRY_TIMES = 5

    const headers: Record<string, any> = {
      ...(cookie && { Cookie: cookie })
    }

    const chunkArray = (arr: string[], size: number) => {
      const chunks: string[][] = []
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size))
      }
      return chunks
    }

    let missingAwemeIds = [...uniqueAwemeIds]
    let retryCount = 0

    while (missingAwemeIds.length > 0 && retryCount < MAX_RETRY_TIMES) {
      const batches = chunkArray(missingAwemeIds, MAX_BATCH_SIZE)

      const responses = await Promise.all(
        batches.map(async (batch) => {
          const params = {
            ...baseParams,
            sp: 850,
            type: 0,
            max_cursor: 0,
            min_cursor: 0,
            count: MAX_BATCH_SIZE,
            aweme_ids: batch.join(',')
          }

          const { data: responseData } = await axios.post(
            TIKTOK_API_URL.GET_MULTI_AWEME_DETAIL,
            undefined,
            {
              params,
              headers,
              paramsSerializer: (p) => new URLSearchParams(p).toString()
            }
          )

          return responseData
        })
      )

      responses.forEach((responseData) => {
        const awemesDetails = responseData?.aweme_list || []
        awemesDetails.forEach((aweme: any) => {
          if (uniqueAwemeIds.includes(aweme.aweme_id)) {
            formattedDetails[aweme.aweme_id] = tiktokUtils.formatAwemeItemResponse(
              aweme
            ) as IAwemeDetails
          }
        })
      })

      missingAwemeIds = uniqueAwemeIds.filter((id) => !formattedDetails[id])
      retryCount++
    }

    return formattedDetails
  } catch (error) {
    throw new Error('Failed to fetch aweme details')
  }
}

const TiktokService = {
  getUserInfoByUsername,
  getUserAwemeList,
  getMultiAwemeDetails
}

export default TiktokService
