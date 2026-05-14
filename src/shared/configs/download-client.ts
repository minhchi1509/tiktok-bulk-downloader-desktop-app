import axios from 'axios'
import http from 'http'
import https from 'https'

const MAX_DOWNLOAD_TIMEOUT = 10 * 60 * 1000 // 10 minutes

export const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 64,
  maxFreeSockets: 16
})

export const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 64,
  maxFreeSockets: 16
})

export const downloadClient = axios.create({
  timeout: MAX_DOWNLOAD_TIMEOUT,
  maxRedirects: 5,
  httpAgent,
  httpsAgent
})
