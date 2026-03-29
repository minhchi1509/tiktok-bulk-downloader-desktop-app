const TIKTOK_API_URL = {
  GET_USER_AWEME_LIST: 'https://aggr22-normal-alisg.tiktokv.com/lite/v2/public/item/list/',
  GET_MULTI_AWEME_DETAIL: 'https://api22-core-c-alisg.tiktokv.com/lite/v2/feed/fyp/'
} as const

const DEFAULT_USER_AGENT =
  'com.zhiliaoapp.musically/2023501030 (Linux; U; Android 13; en_US; Pixel 7; Build/TD1A.220804.031; Cronet/58.0.2991.0)'

const TIKTOK_POST_DETAIL_URL_PATTERN =
  /tiktok\.com\/(?:@[A-Za-z0-9._-]+)\/(?:video|photo)\/(\d+)(?:\?.*)?$/

export { TIKTOK_API_URL, DEFAULT_USER_AGENT, TIKTOK_POST_DETAIL_URL_PATTERN }
