import { Argus } from './argus'
import { bytesToHex } from './buffer-utils'
import { md5Hex } from './crypto-utils'
import { Gorgon } from './gorgon'
import { Ladon } from './ladon'
import { randomBytes } from 'crypto'
import { v4 as uuidv4 } from 'uuid'

export const getBaseMobileParams = () => {
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

const createMobileHeadersSignature = ({
  queryParams,
  bodyPayload,
  cookies
}: {
  queryParams: string
  bodyPayload?: string
  cookies?: string
}) => {
  const unixTimestamp = Math.floor(Date.now() / 1000)
  const aid = 1340
  const licenseId = 1611921764
  const secDeviceId = ''
  const sdkVersion = 'v05.00.03-ov-android'
  const sdkVersionInt = 167773760
  const platform = 0

  try {
    const gorgonInstance = new Gorgon({
      params: queryParams,
      unix: unixTimestamp,
      bodyPayload,
      cookies
    })
    const gorgonHeaders = gorgonInstance.getValue()

    const xLadon = Ladon.encrypt({ khronos: unixTimestamp, licenseId, aid })

    let x_ss_stub: string | undefined = undefined

    if (bodyPayload) {
      x_ss_stub = md5Hex(bodyPayload)
    }

    const xArgus = Argus.getSign({
      queryParams,
      x_ss_stub,
      timestamp: unixTimestamp,
      aid,
      licenseId,
      platform,
      secDeviceId,
      sdkVersion,
      sdkVersionInt
    })

    return {
      'X-Gorgon': gorgonHeaders['X-Gorgon'],
      'X-Khronos': gorgonHeaders['X-Khronos'],
      'x-ss-req-ticket': gorgonHeaders['x-ss-req-ticket'],
      'X-Ladon': xLadon,
      'X-Argus': xArgus,
      'x-ss-stub': x_ss_stub ? x_ss_stub.toUpperCase() : undefined
    }
  } catch (err) {
    throw new Error(
      `Failed to create mobile headers signature: ${(err as Error).stack?.toString()}`
    )
  }
}

export default createMobileHeadersSignature
