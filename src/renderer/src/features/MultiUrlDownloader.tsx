import { Button, Card, TextArea, ScrollShadow, TextField, Label, FieldError } from '@heroui/react'
import { useState, useRef } from 'react'
import { Download, Check, AlertCircle, Loader2 } from 'lucide-react'
import { TIKTOK_POST_DETAIL_URL_PATTERN } from '@shared/constants'
import tiktokUtils, { TFileNameFormatOption } from '@shared/utils/tiktok.util'
import { showErrorToast } from '@renderer/lib/utils/toast'
import { promisePool } from '@shared/utils/common.util'
import type { ITiktokAwemeDetails } from '@minhchi1509/social-media-api/types'
import { Controller, useForm } from 'react-hook-form'
import {
  downloadMultipleUrlsSchema,
  TDownloadMultipleUrlsInput
} from '@renderer/lib/schemas/download'
import { zodResolver } from '@hookform/resolvers/zod'
import SavedLocationSelect from '@renderer/components/forms/SavedLocationSelect'
import FilenameFormatSelect from '@renderer/components/forms/FilenameFormatSelect'
import FormInput from '@renderer/components/forms/FormInput'
import ApiSecretKeyInput from '@renderer/components/forms/ApiSecretKeyInput'

const DOWNLOAD_MULTIPLE_FILE_NAME_FORMAT_OPTIONS: Array<{
  value: TFileNameFormatOption
  label: string
}> = [
  { value: 'id', label: 'ID' },
  { value: 'title', label: 'Description' },
  { value: 'timestamp', label: 'Timestamp' }
]

interface IDownloadItem {
  id: string
  originalUrl: string
  status: 'pending' | 'downloading' | 'success' | 'error'
  error?: string
  data?: ITiktokAwemeDetails
}

const MultiUrlDownloader = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadQueue, setDownloadQueue] = useState<IDownloadItem[]>([])

  // Refs for processing loop
  const isCancelledRef = useRef(false)

  const getFilename = ({
    item,
    ext,
    filenameFormat
  }: {
    item: ITiktokAwemeDetails
    ext: string
    filenameFormat: TFileNameFormatOption[]
  }) => {
    const filename = tiktokUtils.getFilename({
      id: item.id,
      title: item.description,
      timestamp: item.createdAt,
      format: Array.from(filenameFormat)
    })

    return `${filename}.${ext}`
  }

  const downloadItem = async ({
    dataItem,
    itemId,
    savedFolderPath,
    filenameFormat
  }: {
    dataItem: ITiktokAwemeDetails
    itemId: string
    savedFolderPath: string
    filenameFormat: TFileNameFormatOption[]
  }) => {
    try {
      if (dataItem.contentType === 'VIDEO' && dataItem.video) {
        const { success } = await window.api.downloadFile({
          url: dataItem.video.hdPlayUrlList.at(-1) || '',
          fileName: getFilename({ item: dataItem, ext: 'mp4', filenameFormat }),
          folderPath: savedFolderPath
        })
        if (!success) throw new Error('Failed to download video')
      } else if (dataItem.contentType === 'MULTI_PHOTO' && dataItem.imagePost) {
        const baseName = getFilename({ item: dataItem, ext: 'jpg', filenameFormat })
        const photoFolderPath = `${savedFolderPath}/${dataItem.id}`
        await Promise.allSettled(
          dataItem.imagePost.images.map(async (u, k) => {
            const { success } = await window.api.downloadFile({
              url: u.urlList.at(-1) || '',
              fileName: `${k + 1}_${baseName}`,
              folderPath: photoFolderPath
            })
            if (!success) throw new Error('Failed to download photo')
          })
        )
      }

      setDownloadQueue((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, status: 'success', data: dataItem } : i))
      )
    } catch (e) {
      setDownloadQueue((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, status: 'error', error: (e as Error).message } : i
        )
      )
    }
  }

  const startProcessing = async ({
    items,
    detailsById,
    concurrentDownloads,
    saveLocation,
    filenameFormat
  }: {
    items: IDownloadItem[]
    detailsById: Record<string, ITiktokAwemeDetails | null>
  } & TDownloadMultipleUrlsInput) => {
    const validItems = items.filter((item) => Boolean(detailsById[item.id]))

    const maxConcurrency = Math.max(1, concurrentDownloads)

    await promisePool({
      items: validItems,
      concurrency: maxConcurrency,
      worker: async (item) => {
        if (isCancelledRef.current) return
        const details = detailsById[item.id]
        if (!details) {
          setDownloadQueue((prev) =>
            prev.map((queueItem) =>
              queueItem.id === item.id
                ? { ...queueItem, status: 'error', error: 'Post details not found' }
                : queueItem
            )
          )
          return
        }
        setDownloadQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'downloading' } : q))
        )
        await downloadItem({
          dataItem: details,
          itemId: item.id,
          savedFolderPath: saveLocation,
          filenameFormat: filenameFormat as TFileNameFormatOption[]
        })
      }
    })

    setIsProcessing(false)
  }

  const onDownloadClick = async (formValues: TDownloadMultipleUrlsInput) => {
    const lines = formValues.urls.split(/[\n\s]+/).filter((l) => l.trim().length > 0)
    const newItems: IDownloadItem[] = []
    const seenIds = new Set()

    lines.forEach((l) => {
      const match = l.match(TIKTOK_POST_DETAIL_URL_PATTERN)
      if (match && match[1]) {
        if (!seenIds.has(match[1])) {
          newItems.push({ id: match[1], originalUrl: l, status: 'pending' })
          seenIds.add(match[1])
        }
      }
    })

    if (newItems.length === 0) {
      showErrorToast('No valid URLs found')
      return
    }

    setDownloadQueue(newItems)
    setIsProcessing(true)
    isCancelledRef.current = false

    const responseData = await window.api.getMultiAwemeDetails(newItems.map((i) => i.id))

    if (!responseData.success) {
      showErrorToast('Failed to fetch post details')
      setIsProcessing(false)
      return
    }

    const awemeList = responseData.data

    setDownloadQueue((prev) =>
      prev.map((item) => {
        const details = awemeList[item.id]
        if (!details) {
          return {
            ...item,
            status: 'error',
            error: 'Post details not found'
          }
        }
        return {
          ...item,
          data: details,
          status: 'pending'
        }
      })
    )

    startProcessing({
      items: newItems,
      detailsById: awemeList,
      ...formValues
    })
  }

  const downloadMultipleUrlsForm = useForm<TDownloadMultipleUrlsInput>({
    resolver: zodResolver(downloadMultipleUrlsSchema),
    defaultValues: {
      apiSecretKey: '',
      urls: '',
      saveLocation: '',
      filenameFormat: ['id'] as TFileNameFormatOption[],
      concurrentDownloads: 5
    }
  })

  return (
    <Card className="max-w-4xl mx-auto p-6 rounded-lg border">
      <Card.Content>
        <div className="space-y-6">
          <p className="font-semibold text-zinc-600 dark:text-zinc-400">
            Enter multiple TikTok URLs to download them at once.
          </p>

          <Controller
            control={downloadMultipleUrlsForm.control}
            name="apiSecretKey"
            render={({ field: { ref, ...fieldProps }, fieldState: { error, invalid } }) => (
              <ApiSecretKeyInput
                isDisabled={isProcessing}
                isInvalid={invalid}
                className="grow"
                errorMessage={error?.message}
                {...fieldProps}
              />
            )}
          />

          <Controller
            control={downloadMultipleUrlsForm.control}
            name="urls"
            render={({ field: { ref, ...fieldProps }, fieldState: { error, invalid } }) => (
              <TextField isRequired isDisabled={isProcessing} isInvalid={invalid} {...fieldProps}>
                <Label>URLs</Label>
                <TextArea
                  placeholder="Paste Tiktok links here (one per line or space separated)...&#10;https://www.tiktok.com/@user/video/75899...&#10;https://www.tiktok.com/@user/photo/75880..."
                  rows={10}
                  className="resize-none"
                  variant="secondary"
                />
                <FieldError>{error?.message}</FieldError>
              </TextField>
            )}
          />

          <Controller
            control={downloadMultipleUrlsForm.control}
            name="saveLocation"
            render={({ field: { ref, ...fieldProps }, fieldState: { error, invalid } }) => (
              <SavedLocationSelect
                name={fieldProps.name}
                value={fieldProps.value}
                isDisabled={isProcessing}
                onFolderPathChange={(path) => fieldProps.onChange(path)}
                errorMessage={error?.message}
                isInvalid={invalid}
              />
            )}
          />

          <div className="flex gap-2">
            <Controller
              control={downloadMultipleUrlsForm.control}
              name="filenameFormat"
              render={({ field: { ref, ...fieldProps }, fieldState: { error, invalid } }) => (
                <FilenameFormatSelect
                  options={DOWNLOAD_MULTIPLE_FILE_NAME_FORMAT_OPTIONS}
                  name={fieldProps.name}
                  value={fieldProps.value}
                  isDisabled={isProcessing}
                  onChange={(path) => fieldProps.onChange(path)}
                  errorMessage={error?.message}
                  isInvalid={invalid}
                  className="grow"
                />
              )}
            />

            <Controller
              control={downloadMultipleUrlsForm.control}
              name="concurrentDownloads"
              render={({ field: { ref, ...fieldProps }, fieldState: { error, invalid } }) => (
                <FormInput
                  name={fieldProps.name}
                  label="Download concurrency"
                  value={String(fieldProps.value)}
                  onChange={(val) => fieldProps.onChange(parseInt(val, 10))}
                  isDisabled={isProcessing}
                  isRequired
                  errorMessage={error?.message}
                  isInvalid={invalid}
                  className="grow max-w-fit"
                  inputProps={{
                    type: 'number',
                    variant: 'secondary',
                    placeholder: 'Enter concurrent downloads'
                  }}
                />
              )}
            />
          </div>

          <Button
            variant={isProcessing ? 'danger' : 'primary'}
            onPress={() => {
              if (isProcessing) {
                isCancelledRef.current = true
                setIsProcessing(false) // Optimistic UI update
              } else {
                downloadMultipleUrlsForm.handleSubmit(onDownloadClick)()
              }
            }}
            className="w-full font-bold text-md"
            size="lg"
          >
            {isProcessing ? <AlertCircle /> : <Download />}
            {isProcessing ? 'Stop Downloading' : 'Start Download'}
          </Button>

          {/* Status Queue Section */}
          {downloadQueue.length > 0 && (
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-zinc-600 dark:text-zinc-400">
                  Download Queue ({downloadQueue.length})
                </h3>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  Success: {downloadQueue.filter((i) => i.status === 'success').length} | Failed:{' '}
                  {downloadQueue.filter((i) => i.status === 'error').length}
                </span>
              </div>

              <ScrollShadow
                className="h-75 w-full rounded-lg border p-2 gap-2 flex flex-col"
                visibility="none"
              >
                {downloadQueue.map((item) => (
                  <Card key={item.id} className="w-full border flex-none rounded-xl">
                    <Card.Content className="flex flex-row items-center gap-3 overflow-hidden">
                      <div className="min-w-20 text-xs text-zinc-600 dark:text-zinc-400">
                        {item.id}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="text-xs truncate">
                          {item.data?.description || item.originalUrl}
                        </div>
                        {item.status === 'error' && (
                          <div className="text-xs text-danger truncate">{item.error}</div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {item.status === 'pending' && (
                          <div className="text-xs text-zinc-600 dark:text-zinc-400">Pending</div>
                        )}
                        {item.status === 'downloading' && (
                          <Loader2 className="animate-spin text-primary" size={18} />
                        )}
                        {item.status === 'success' && <Check className="text-success" size={18} />}
                        {item.status === 'error' && (
                          <AlertCircle className="text-danger" size={18} />
                        )}
                      </div>
                    </Card.Content>
                  </Card>
                ))}
              </ScrollShadow>
            </div>
          )}
        </div>
      </Card.Content>
    </Card>
  )
}

export default MultiUrlDownloader
