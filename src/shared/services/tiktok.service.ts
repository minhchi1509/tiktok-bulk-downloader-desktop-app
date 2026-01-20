import { TIKTOK_API_URL } from '@shared/constants'
import createMobileHeadersSignature, {
  getBaseMobileParams
} from '@shared/tiktok-signer/signHeadersMobile'
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

const searchUserIdByUsername = async (
  username: string,
  options: IpcGetAwemeDetailsOptions
): Promise<string> => {
  try {
    const baseParams = getBaseMobileParams()
    const params = {
      ...baseParams,
      cursor: '0',
      enable_lite_workflow: '1',
      enter_from: 'web',
      enable_lite_cut: '1',
      backtrace: '',
      keyword: username,
      count: '1',
      last_search_id: '',
      end_to_end_search_session_id: '',
      query_correct_type: '1',
      search_source: 'search_history',
      search_id: '',
      request_tag_from: 'h5'
    }

    const queryString = qs.stringify(params)
    const signatureHeaders = createMobileHeadersSignature({
      queryParams: queryString,
      cookies: options.cookie
    })
    const headers: Record<string, string> = {
      Cookie: options.cookie
    }
    Object.entries(signatureHeaders).forEach(([k, v]) => {
      if (v) headers[k] = v
    })
    const { data: responseData } = await axios.get(TIKTOK_API_URL.SEARCH_USER, {
      params,
      headers,
      paramsSerializer: (params) => {
        return qs.stringify(params, {
          encode: true
        })
      }
    })

    const userId = tiktokUtils.findValueByKey(responseData, 'uid')
    if (!userId) {
      throw new Error()
    }
    return userId
  } catch (error) {
    throw new Error('Failed to search user ID by username')
  }
}

const getUserInfoByUsername = async (
  username: string,
  options: IpcGetAwemeDetailsOptions
): Promise<IUserInfo> => {
  try {
    const userId = await searchUserIdByUsername(username, options)

    const baseParams = getBaseMobileParams()
    const params = {
      ...baseParams,
      sec_user_id: '',
      user_id: userId,
      unique_id: username,
      lite_flow_schedule: 'new'
    }

    const queryString = qs.stringify(params)
    const signatureHeaders = createMobileHeadersSignature({
      queryParams: queryString
    })
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent':
        'com.zhiliaoapp.musically.go/420004 (Linux; U; Android 9; en_US; SM-G998B; Build/SP1A.210812.016;tt-ok/3.12.13.44.lite-ul)',
      Cookie: options.cookie
    }
    Object.entries(signatureHeaders).forEach(([k, v]) => {
      if (v) headers[k] = v
    })
    const { data: responseData } = await axios.get(TIKTOK_API_URL.GET_USER_INFO, {
      params,
      headers,
      paramsSerializer: (params) => {
        return qs.stringify(params, {
          encode: true
        })
      }
    })

    const userInfo = responseData.user

    if (!userInfo || userInfo.unique_id.toLowerCase() !== username.toLowerCase()) {
      throw new Error(`User ${username} not found`)
    }

    return {
      uid: userInfo.uid,
      uniqueId: userInfo.unique_id,
      secUid: userInfo.sec_uid,
      followerCount: userInfo.follower_count,
      followingCount: userInfo.following_count,
      avatarUri:
        userInfo.avatar_larger?.url_list?.[0] ||
        userInfo.avatar_medium?.url_list?.[0] ||
        userInfo.avatar_thumb?.url_list?.[0] ||
        ''
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
    const baseParams = getBaseMobileParams()
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
    const queryString = qs.stringify(params)
    const signatureHeaders = createMobileHeadersSignature({
      queryParams: queryString,
      cookies
    })
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-tt-ttnet-origin-host': 'api22-normal-c-alisg.tiktokv.com',
      Host: 'aggr22-normal-alisg.tiktokv.com',
      Cookie: cookies
    }

    Object.entries(signatureHeaders).forEach(([k, v]) => {
      if (v) headers[k] = v
    })
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
