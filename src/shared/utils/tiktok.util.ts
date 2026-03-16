import { v4 as uuidv4 } from 'uuid'
import sanitize from 'sanitize-filename'

import { IAwemeDetails, ITiktokAwemeItemStats, ITiktokVideo } from '@shared/types/tiktok.type'

const getHighestQualityVideoUri = (bitRateArr: any): string => {
  if (!Array.isArray(bitRateArr) || bitRateArr.length === 0) {
    return ''
  }
  const highestQualityVideo = bitRateArr.reduce((prev: any, current: any) => {
    const prevResolution = (prev?.play_addr?.width || 0) * (prev?.play_addr?.height || 0)
    const currentResolution = (current?.play_addr?.width || 0) * (current?.play_addr?.height || 0)
    return currentResolution > prevResolution ? current : prev
  })
  return highestQualityVideo?.play_addr?.url_list?.at(-1) || ''
}

const formatAwemeItemResponse = (item: any): IAwemeDetails | null => {
  try {
    const id = item.aweme_id
    const url = item.share_url
    const description = item.desc
    const createdAt = item.create_time
    const type = item.image_post_info ? 'PHOTO' : 'VIDEO'
    const stats: ITiktokAwemeItemStats = {
      likes: item.statistics.digg_count,
      comments: item.statistics.comment_count,
      shares: item.statistics.share_count,
      views: item.statistics.play_count,
      collects: item.statistics.collect_count
    }
    const imagesUri =
      type === 'PHOTO'
        ? item.image_post_info.images.map((img: any) => img.display_image.url_list[0])
        : []
    const musicUri = item.music?.play_url?.url_list?.[0] || ''
    const video: ITiktokVideo | undefined =
      type === 'VIDEO'
        ? {
            coverUri: item.video.origin_cover?.url_list?.[0] || '',
            mp4Uri: getHighestQualityVideoUri(item.video.bit_rate)
          }
        : undefined
    return {
      id,
      url,
      description,
      createdAt,
      type,
      stats,
      video,
      imagesUri,
      musicUri
    }
  } catch (error) {
    return null
  }
}

const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const randomBytes = (size: number): Uint8Array => {
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)
  return bytes
}

const getBaseMobileParams = () => {
  const device_id = '7555746395380368897'
  const iid = '7580036180676593416'

  const cdid = uuidv4()
  const openudid = bytesToHex(randomBytes(8))
  const timestamp = Math.floor(Date.now() / 1000)
  return {
    _rticket: Date.now(),
    device_id,
    ts: timestamp,
    iid,
    openudid,
    cdid,
    manifest_version_code: 420506,
    app_language: 'en',
    app_type: 'normal',
    app_package: 'com.zhiliaoapp.musically.go',
    channel: 'googleplay',
    device_type: 'SM-G998B',
    language: 'en',
    host_abi: 'x86_64',
    locale: 'en',
    resolution: '900*1600',
    update_version_code: 420506,
    ac2: 'wifi5g',
    sys_region: 'US',
    os_api: 28,
    timezone_name: 'Asia/Saigon',
    dpi: 240,
    carrier_region: 'VN',
    ac: 'wifi',
    os: 'android',
    os_version: '12',
    timezone_offset: 25200,
    version_code: 420506,
    app_name: 'musically_go',
    ab_version: '42.5.6',
    version_name: '42.5.6',
    device_brand: 'samsung',
    op_region: 'VN',
    ssmix: 'a',
    device_platform: 'android',
    build_number: '42.5.6',
    region: 'VN',
    aid: 1340
  }
}

export type TFileNameFormatOption = 'id' | 'timestamp' | 'numericalOrder' | 'title'
export const getFilename = ({
  order,
  id,
  title,
  timestamp,
  format
}: {
  order?: number | string
  id?: string
  title?: string
  timestamp?: number | string
  format: TFileNameFormatOption[]
}) => {
  const defaultFilename = [order, id].filter((part) => Boolean(part)).join('_')

  if (!format || format.length === 0) {
    return sanitize(defaultFilename)
  }

  const parts = format.map((f) => {
    switch (f) {
      case 'numericalOrder':
        return order
      case 'id':
        return id
      case 'title':
        return title ? sanitize(title) : ''
      case 'timestamp':
        return timestamp
      default:
        return ''
    }
  })

  // Remove empty parts and join by underscore
  let filename = parts.filter((part) => Boolean(part)).join('_')

  /**
   * Remove zero-width characters and format control characters.
   * These valid unicode characters can cause "Invalid filename" errors in chrome.downloads API.
   *
   * \u200B-\u200F: Zero Width Space, ZWNJ, ZWJ, LRM, RLM
   * \u202A-\u202E: LRE, RLE, PDF, LRO, RLO
   * \u2060-\u206F: Word Joiner, Function Application, Invisible Separator, Bidi Isolates...
   * \uFE00-\uFE0F: Variation Selectors (inclusive of \uFE0E)
   */
  filename = filename.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFE00-\uFE0F]/g, '')

  return sanitize(filename || defaultFilename)
}

const tiktokUtils = {
  formatAwemeItemResponse,
  getBaseMobileParams,
  getFilename
}

export default tiktokUtils
