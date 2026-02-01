import { TIKTOK_API_URL } from '@shared/constants'
import { IpcGetAwemeListOptions, IpcGetAwemeDetailsOptions } from '@shared/types/ipc.type'
import {
  IUserInfo,
  IAwemeListResponse,
  IAwemeItem,
  ITiktokCredentials
} from '@shared/types/tiktok.type'
import tiktokUtils from '@shared/utils/tiktok.util'
import axios from 'axios'
import qs from 'qs'

const getUserInfoByUsername = async (
  username: string,
  options: IpcGetAwemeDetailsOptions
): Promise<IUserInfo> => {
  try {
    const { data: rawResponse } = await axios.get(`https://www.tiktok.com/@${username}`, {
      headers: {
        Cookie: options.cookie,
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
  options: IpcGetAwemeListOptions
): Promise<IAwemeListResponse> => {
  try {
    const { maxCursor = '0', cursor = '0', cookie: cookies = '' } = options || {}
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
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-tt-ttnet-origin-host': 'api22-normal-c-alisg.tiktokv.com',
      Host: 'aggr22-normal-alisg.tiktokv.com',
      Cookie: cookies
    }

    const { data: responseData } = await axios.get(TIKTOK_API_URL.GET_USER_AWEME_LIST, {
      params,
      headers,
      paramsSerializer: (params) => {
        return qs.stringify(params, {
          encode: true
        })
      }
    })
    const hasMore = responseData.has_more === 1
    const awemeList = responseData.aweme_list || []
    const pagination = {
      cursor: responseData.min_cursor?.toString() || '',
      maxCursor: responseData.max_cursor?.toString() || '',
      hasMore
    }
    const formattedAwemeList = awemeList.map((item: any) =>
      tiktokUtils.formatAwemeItemResponse(item)
    )
    return {
      awemeList: formattedAwemeList,
      pagination
    }
  } catch (error) {
    throw new Error('Failed to fetch user aweme list')
  }
}

const getAwemeDetails = async (awemeUrl: string): Promise<IAwemeItem> => {
  try {
    const body = {
      url: awemeUrl,
      hd: 1
    }
    const { data: responseData } = await axios.post('https://www.tikwm.com/api/', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      }
    })

    const postData = responseData.data

    const postType = postData.images ? 'PHOTO' : 'VIDEO'
    const awemeItem: IAwemeItem = {
      id: postData.id,
      type: postType,
      description: postData.title,
      url: awemeUrl,
      createdAt: postData.create_time,
      stats: {
        likes: postData.digg_count,
        comments: postData.comment_count,
        shares: postData.share_count,
        views: postData.play_count,
        collects: postData.collect_count
      },
      musicUri: postData.music || postData?.music_info?.play,
      imagesUri: postType === 'PHOTO' ? postData.images : undefined,
      video:
        postType === 'VIDEO'
          ? {
              coverUri: postData.cover || postData.origin_cover || '',
              mp4Uri: postData.hdplay || postData.play || ''
            }
          : undefined
    }
    console.log('✅✅✅ Aweme item:', awemeItem)

    return awemeItem
  } catch (error) {
    throw new Error('Failed to fetch aweme details')
  }
}

const getCredentials = async (): Promise<ITiktokCredentials> => {
  try {
    const gistId = (import.meta.env as any).MAIN_VITE_GIST_ID
    const gistSecretKey = (import.meta.env as any).MAIN_VITE_GIST_SECRET_KEY
    const { data: responseData } = await axios.get(`https://api.github.com/gists/${gistId}`, {
      headers: {
        Authorization: `Bearer ${gistSecretKey}`,
        Accept: 'application/vnd.github+json'
      }
    })
    const content = responseData.files['tiktok-mobile-credentials.json'].content
    const data: ITiktokCredentials = JSON.parse(content)

    return data
  } catch (error) {
    throw new Error('Failed to fetch TikTok credentials')
  }
}

const TiktokService = {
  getUserInfoByUsername,
  getUserAwemeList,
  getAwemeDetails,
  getCredentials
}

export default TiktokService
