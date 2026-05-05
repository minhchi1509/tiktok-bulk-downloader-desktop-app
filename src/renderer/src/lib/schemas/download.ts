import { z } from 'zod'

export const getAwemeListSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  apiSecretKey: z.string().min(1, 'API secret key is required'),
  delayBetweenRequests: z.number().min(0, 'Delay between requests must be a non-negative number')
})

export const downloadOptionsSchema = z.object({
  saveLocation: z.string().min(1, 'Save location is required'),
  filenameFormat: z.array(z.string()).min(1, 'At least one filename format is required'),
  concurrentDownloads: z.number().min(1, 'Concurrent downloads must be at least 1')
})

export const downloadMultipleUrlsSchema = downloadOptionsSchema.extend({
  apiSecretKey: z.string().min(1, 'API secret key is required'),
  urls: z.string().min(1, 'At least one URL is required')
})

export type TGetAwemeListInput = z.infer<typeof getAwemeListSchema>
export type TDownloadOptions = z.infer<typeof downloadOptionsSchema>
export type TDownloadMultipleUrlsInput = z.infer<typeof downloadMultipleUrlsSchema>
