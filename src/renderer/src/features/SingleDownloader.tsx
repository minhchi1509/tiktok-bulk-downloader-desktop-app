import {
  Button,
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
  Chip,
  Tooltip,
  Textarea,
  ScrollShadow
} from '@heroui/react'
import { useState, useEffect, useRef } from 'react'
import { FolderOpen, Download, Check, AlertCircle, Loader2, Save } from 'lucide-react'
import { IAwemeDetails } from '@shared/types/tiktok.type'
import { TIKTOK_POST_DETAIL_URL_PATTERN } from '@shared/constants'
import tiktokUtils, { TFileNameFormatOption } from '@shared/utils/tiktok.util'
import { showErrorToast, showSuccessToast } from '@renderer/lib/toast'
import { promisePool } from '@shared/utils/common.util'

const TIKTOK_COOKIE_SETTINGS_KEY = 'tiktok_cookie'
const SINGLE_CONCURRENCY_SETTINGS_KEY = 'single_concurrency'

const FILE_NAME_FORMAT_OPTIONS: Array<{ key: TFileNameFormatOption; label: string }> = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Description' },
  { key: 'timestamp', label: 'Timestamp' }
]

interface IDownloadItem {
  id: string
  originalUrl: string
  status: 'pending' | 'downloading' | 'success' | 'error'
  error?: string
  data?: IAwemeDetails
}

const SingleDownloader = () => {
  const [inputUrls, setInputUrls] = useState('')
  const [folderPath, setFolderPath] = useState('')
  const [fileNameFormat, setFileNameFormat] = useState<Set<TFileNameFormatOption>>(new Set(['id']))
  const [tiktokCookie, setTiktokCookie] = useState('')
  const [isSavingCookie, setIsSavingCookie] = useState(false)
  const [concurrentDownloads, setConcurrentDownloads] = useState('5')
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadQueue, setDownloadQueue] = useState<IDownloadItem[]>([])

  // Refs for processing loop
  const isCancelledRef = useRef(false)

  useEffect(() => {
    const loadInitialSettings = async () => {
      const [{ data: path }, savedCookieResult, savedConcurrencyResult] = await Promise.all([
        window.api.getDefaultDownloadPath(),
        window.api.getSettings<string>(TIKTOK_COOKIE_SETTINGS_KEY),
        window.api.getSettings<string>(SINGLE_CONCURRENCY_SETTINGS_KEY)
      ])

      if (path) {
        setFolderPath(path)
      }

      if (savedCookieResult?.success && typeof savedCookieResult.data === 'string') {
        setTiktokCookie(savedCookieResult.data)
      }

      if (savedConcurrencyResult?.success && savedConcurrencyResult.data) {
        const parsed = Number.parseInt(String(savedConcurrencyResult.data), 10)
        if (!Number.isNaN(parsed) && parsed > 0) {
          setConcurrentDownloads(String(parsed))
        }
      }
    }

    loadInitialSettings()
  }, [])

  const handleSaveCookie = async () => {
    setIsSavingCookie(true)
    try {
      await window.api.saveSettings(TIKTOK_COOKIE_SETTINGS_KEY, tiktokCookie.trim())
      showSuccessToast('TikTok cookie saved successfully')
    } catch (_error) {
      showErrorToast('Failed to save TikTok cookie')
    } finally {
      setIsSavingCookie(false)
    }
  }

  const handleConcurrencyChange = (value: string) => {
    setConcurrentDownloads(value)
    const parsed = Number.parseInt(value, 10)
    if (!Number.isNaN(parsed) && parsed > 0) {
      window.api.saveSettings(SINGLE_CONCURRENCY_SETTINGS_KEY, String(parsed))
    }
  }

  const handleSelectFolder = async () => {
    const { data: path } = await window.api.selectFolder()
    if (path) setFolderPath(path)
  }

  const getFilename = (item: IAwemeDetails, ext: string) => {
    const filename = tiktokUtils.getFilename({
      id: item.id,
      title: item.description,
      timestamp: item.createdAt,
      format: Array.from(fileNameFormat)
    })

    return `${filename}.${ext}`
  }

  const downloadItem = async (dataItem: IAwemeDetails, itemId: string, targetFolder: string) => {
    try {
      if (dataItem.type === 'VIDEO' && dataItem.video) {
        const { success } = await window.api.downloadFile({
          url: dataItem.video.mp4Uri,
          fileName: getFilename(dataItem, 'mp4'),
          folderPath: targetFolder
        })
        if (!success) throw new Error('Failed to download video')
      } else if (dataItem.type === 'PHOTO' && dataItem.imagesUri) {
        const baseName = getFilename(dataItem, 'jpg')
        const photoFolderPath = `${targetFolder}/${dataItem.id}`
        await Promise.allSettled(
          dataItem.imagesUri.map(async (u, k) => {
            const { success } = await window.api.downloadFile({
              url: u,
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

  const startProcessing = async (
    items: IDownloadItem[],
    detailsById: Record<string, IAwemeDetails>
  ) => {
    let targetFolder = folderPath
    if (!targetFolder) {
      targetFolder =
        (await window.api.getDefaultDownloadPath().then(({ data: path }) => path)) || ''
    }

    const validItems = items.filter((item) => Boolean(detailsById[item.id]))

    const maxConcurrency = Math.max(1, Number.parseInt(concurrentDownloads, 10) || 1)

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
        await downloadItem(details, item.id, targetFolder)
      }
    })

    setIsProcessing(false)
  }

  const onDownloadClick = async () => {
    if (!folderPath) {
      const { data: path } = await window.api.getDefaultDownloadPath()
      if (path) setFolderPath(path)
      else {
        showErrorToast('Please select a download folder')
        return
      }
    }

    const lines = inputUrls.split(/[\n\s]+/).filter((l) => l.trim().length > 0)
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

    const cookie = tiktokCookie.trim()
    const detailResult = await window.api.getMultiAwemeDetails(
      newItems.map((item) => item.id),
      cookie ? { cookie } : undefined
    )

    if (!detailResult.success || !detailResult.data) {
      setIsProcessing(false)
      showErrorToast(detailResult.error || 'Failed to fetch post details')
      return
    }

    const detailsById = detailResult.data
    setDownloadQueue((prev) =>
      prev.map((item) => {
        const details = detailsById[item.id]
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

    startProcessing(newItems, detailsById)
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto mt-6 p-6 bg-content1 rounded-xl shadow-lg border border-divider">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-secondary">
            Multi-Link Downloader
          </h2>
          <p className="text-default-500">Enter multiple TikTok URLs to download them at once.</p>
        </div>

        <Textarea
          label="Tiktok URLs"
          placeholder="Paste Tiktok links here (one per line or space separated)...&#10;https://www.tiktok.com/@user/video/75899...&#10;https://www.tiktok.com/@user/photo/75880..."
          minRows={5}
          maxRows={10}
          value={inputUrls}
          onValueChange={setInputUrls}
          variant="bordered"
          isDisabled={isProcessing}
        />

        <div className="flex flex-col gap-4">
          <div className="flex gap-4 items-end">
            <Tooltip delay={0} content={folderPath} placement="top" isDisabled={!folderPath}>
              <Input
                label="Save Location"
                value={folderPath}
                readOnly
                placeholder="Default: Downloads"
                className="flex-1"
                variant="bordered"
                endContent={
                  <FolderOpen
                    className="text-default-400 cursor-pointer hover:text-primary"
                    onClick={handleSelectFolder}
                  />
                }
              />
            </Tooltip>

            <Input
              label="TikTok Cookie (optional)"
              value={tiktokCookie}
              onValueChange={setTiktokCookie}
              className="flex-1"
              variant="bordered"
              isDisabled={isProcessing}
              endContent={
                <button
                  type="button"
                  aria-label="Save TikTok cookie"
                  onClick={handleSaveCookie}
                  disabled={isProcessing || isSavingCookie || !tiktokCookie.trim()}
                  className="flex items-center justify-center text-default-400 disabled:opacity-40 enabled:hover:text-primary"
                >
                  {isSavingCookie ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                </button>
              }
            />
          </div>

          <Input
            label="Concurrent Downloads"
            value={concurrentDownloads}
            onValueChange={handleConcurrencyChange}
            type="number"
            min={1}
            variant="bordered"
            isDisabled={isProcessing}
          />

          <Select
            classNames={{ label: 'mb-2' }}
            label="Filename Format"
            selectionMode="multiple"
            selectedKeys={fileNameFormat}
            onSelectionChange={(keys) => setFileNameFormat(keys as Set<TFileNameFormatOption>)}
            variant="bordered"
            renderValue={(items) => (
              <div className="flex flex-wrap items-center gap-1">
                {items.map((item, index) => (
                  <div key={item.key} className="flex items-center gap-1">
                    <Chip size="sm" variant="flat" color="primary">
                      {item.textValue}
                    </Chip>
                    {index < items.length - 1 && <span className="text-default-400">_</span>}
                  </div>
                ))}
              </div>
            )}
          >
            {FILE_NAME_FORMAT_OPTIONS.map((option) => (
              <SelectItem key={option.key}>{option.label}</SelectItem>
            ))}
          </Select>
        </div>

        <Button
          color={isProcessing ? 'danger' : 'primary'}
          onPress={() => {
            if (isProcessing) {
              isCancelledRef.current = true
              setIsProcessing(false) // Optimistic UI update
            } else {
              onDownloadClick()
            }
          }}
          className="w-full font-bold text-md"
          size="lg"
          startContent={isProcessing ? <AlertCircle /> : <Download />}
        >
          {isProcessing ? 'Stop Downloading' : 'Start Download'}
        </Button>

        {/* Status Queue Section */}
        {downloadQueue.length > 0 && (
          <div className="flex flex-col gap-3 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-default-600">
                Download Queue ({downloadQueue.length})
              </h3>
              <span className="text-tiny text-default-400">
                Success: {downloadQueue.filter((i) => i.status === 'success').length} | Failed:{' '}
                {downloadQueue.filter((i) => i.status === 'error').length}
              </span>
            </div>

            <ScrollShadow
              className="h-75 w-full rounded-lg border border-divider p-2 gap-2 flex flex-col"
              visibility="none"
            >
              {downloadQueue.map((item) => (
                <Card
                  key={item.id}
                  className="w-full shadow-sm border border-default-100 flex-none"
                >
                  <CardBody className="flex flex-row items-center gap-3 p-3 overflow-hidden">
                    <div className="min-w-20 font-mono text-small text-default-500">{item.id}</div>

                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="text-small truncate">
                        {item.data?.description || item.originalUrl}
                      </div>
                      {item.status === 'error' && (
                        <div className="text-tiny text-danger truncate">{item.error}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === 'pending' && (
                        <div className="text-tiny text-default-400">Pending</div>
                      )}
                      {item.status === 'downloading' && (
                        <Loader2 className="animate-spin text-primary" size={18} />
                      )}
                      {item.status === 'success' && <Check className="text-success" size={18} />}
                      {item.status === 'error' && <AlertCircle className="text-danger" size={18} />}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </ScrollShadow>
          </div>
        )}
      </div>
    </div>
  )
}

export default SingleDownloader
