import axios from 'axios'
import http from 'http'
import https from 'https'

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
  timeout: 30000,
  maxRedirects: 5,
  httpAgent,
  httpsAgent
})
