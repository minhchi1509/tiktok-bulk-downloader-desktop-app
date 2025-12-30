import { TIKTOK_API_URL } from '@shared/constants'
import createMobileHeadersSignature, {
  getBaseMobileParams
} from '@shared/tiktok-signer/signHeadersMobile'
import { IpcGetAwemeListOptions, IpcGetAwemeDetailsOptions } from '@shared/types/ipc.type'
import { IUserInfo, IAwemeListResponse, IAwemeItem } from '@shared/types/tiktok.type'
import tiktokUtils from '@shared/utils/tiktok.util'
import axios from 'axios'
import qs from 'qs'

const getUserInfo = async (username: string): Promise<IUserInfo> => {
  try {
    const baseParams = getBaseMobileParams()
    const params = {
      ...baseParams,
      cursor: '0',
      keyword: username,
      count: '1',
      type: '1',
      search_source: 'normal_search'
    }

    const queryString = qs.stringify(params)
    const signatureHeaders = createMobileHeadersSignature({
      queryParams: queryString
    })
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-tt-ttnet-origin-host': 'api22-normal-c-alisg.tiktokv.com'
    }
    Object.entries(signatureHeaders).forEach(([k, v]) => {
      if (v) headers[k] = v
    })
    const { data: responseData } = await axios.get(TIKTOK_API_URL.GET_USER_DETAILS, {
      params,
      headers,
      paramsSerializer: (params) => {
        return qs.stringify(params, {
          encode: true
        })
      }
    })
    const user = responseData.user_list?.find((u: any) => u.user_info?.unique_id === username)
    if (!user) {
      throw new Error(`User ${username} not found`)
    }
    const userInfo = user.user_info
    return {
      uid: userInfo.uid,
      uniqueId: userInfo.unique_id,
      secUid: userInfo.sec_uid,
      awemeCount: userInfo.aweme_count,
      followerCount: userInfo.follower_count,
      followingCount: userInfo.following_count,
      avatarUri: userInfo.avatar_larger?.url_list?.[0] || ''
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

const getAwemeDetails = async (
  awemeId: string,
  options?: IpcGetAwemeDetailsOptions
): Promise<IAwemeItem> => {
  try {
    const baseParams = getBaseMobileParams()
    const params = {
      ...baseParams,
      aweme_id: awemeId,
      origin_type: 'web',
      request_source: '0',

      // E-commerce related
      ecom_version: '350900',
      ecomAppVersion: '35.9.0',
      ecom_version_code: '350900',
      ecom_version_name: '35.9.0',
      ecom_appid: '614896',
      ecom_build_number: '1.0.10-alpha.67.2-bugfix',
      ecom_commit_id: '4abc9b292',
      ecom_aar_version: '1.0.10-alpha.67.2-bugfix'
    }
    const queryString = qs.stringify(params)
    const signatureHeaders = createMobileHeadersSignature({
      queryParams: queryString,
      cookies: options?.cookie
    })
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-tt-ttnet-origin-host': 'api22-normal-c-alisg.tiktokv.com'
    }

    Object.entries(signatureHeaders).forEach(([k, v]) => {
      if (v) headers[k] = v
    })
    const { data: responseData } = await axios.get(TIKTOK_API_URL.GET_AWEME_DETAIL, {
      params,
      headers,
      paramsSerializer: (params) => {
        return qs.stringify(params, {
          encode: true
        })
      }
    })
    return tiktokUtils.formatAwemeItemResponse(responseData.aweme_detail)
  } catch (error) {
    throw new Error('Failed to fetch aweme details')
  }
}

const TiktokService = {
  getUserInfo,
  getUserAwemeList,
  getAwemeDetails
}

export default TiktokService
