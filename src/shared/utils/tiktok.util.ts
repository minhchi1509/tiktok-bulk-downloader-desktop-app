import { IAwemeItem, ITiktokAwemeItemStats, ITiktokVideo } from '@shared/types/tiktok.type'

import { v4 as uuidv4 } from 'uuid'

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

const formatAwemeItemResponse = (item: any): IAwemeItem => {
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
}

export const findValueByKey = (obj: Record<string, any>, targetKey: string): any | undefined => {
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue

    if (key === targetKey) {
      return obj[key] // Tìm thấy thì trả về giá trị
    }

    // Nếu là object lồng nhau thì đệ quy
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const result = findValueByKey(obj[key], targetKey)
      if (result !== undefined) {
        return result
      }
    }
  }

  return undefined // Không tìm thấy
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
    manifest_version_code: 410405,
    app_language: 'en',
    app_type: 'normal',
    app_package: 'com.zhiliaoapp.musically.go',
    channel: 'googleplay',
    device_type: 'SM-G998B',
    language: 'en',
    host_abi: 'x86_64',
    locale: 'en',
    resolution: '900*1600',
    update_version_code: 410405,
    ac2: 'wifi',
    sys_region: 'US',
    os_api: 28,
    timezone_name: 'Asia/Saigon',
    dpi: 240,
    carrier_region: 'VN',
    ac: 'wifi',
    os: 'android',
    os_version: '9',
    timezone_offset: 25200,
    version_code: 410405,
    app_name: 'musically_go',
    ab_version: '41.4.5',
    version_name: '41.4.5',
    device_brand: 'samsung',
    op_region: 'VN',
    ssmix: 'a',
    device_platform: 'android',
    build_number: '41.4.5',
    region: 'US',
    aid: 1340
  }
}

const tiktokUtils = {
  formatAwemeItemResponse,
  findValueByKey,
  getBaseMobileParams
}

export default tiktokUtils
