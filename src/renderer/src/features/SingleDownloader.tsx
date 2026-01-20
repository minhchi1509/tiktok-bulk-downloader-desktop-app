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
import { FolderOpen, Download, Check, AlertCircle, Loader2 } from 'lucide-react'
import { IAwemeItem } from '@shared/types/tiktok.type'
import { showErrorToast } from '@renderer/lib/toast'

interface IDownloadItem {
  id: string
  originalUrl: string
  status: 'pending' | 'downloading' | 'success' | 'error'
  error?: string
  data?: IAwemeItem
}

const SingleDownloader = () => {
  const [inputUrls, setInputUrls] = useState('')
  const [folderPath, setFolderPath] = useState('')
  const [fileNameFormat, setFileNameFormat] = useState<Set<string>>(new Set(['ID']))
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadQueue, setDownloadQueue] = useState<IDownloadItem[]>([])

  // Refs for processing loop
  const isCancelledRef = useRef(false)
  const pendingDownloadsRef = useRef(0)

  useEffect(() => {
    window.api.getDefaultDownloadPath().then(({ data: path }) => {
      if (path) setFolderPath(path)
    })
  }, [])

  const handleSelectFolder = async () => {
    const { data: path } = await window.api.selectFolder()
    if (path) setFolderPath(path)
  }

  const sanitizeFilename = (name: string) => {
    return name
      ? name
          .replace(/[<>:"/\\|?*]+/g, '')
          .trim()
          .substring(0, 100)
      : 'no_desc'
  }

  const getFilename = (item: IAwemeItem, _index: number, ext: string) => {
    const formatKeys = Array.from(fileNameFormat)
    const parts: string[] = []

    formatKeys.forEach((key) => {
      if (key === 'ID') parts.push(item.id)
      if (key === 'Timestamp') parts.push(item.createdAt.toString())
      if (key === 'Description') parts.push(sanitizeFilename(item.description))
    })

    return parts.length > 0 ? `${parts.join('_')}.${ext}` : `${item.id}.${ext}`
  }

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const downloadItem = async (dataItem: IAwemeItem, itemId: string, targetFolder: string) => {
    try {
      if (dataItem.type === 'VIDEO' && dataItem.video) {
        const { success } = await window.api.downloadFile({
          url: dataItem.video.mp4Uri,
          fileName: getFilename(dataItem, 0, 'mp4'),
          folderPath: targetFolder
        })
        if (!success) throw new Error('Failed to download video')
      } else if (dataItem.type === 'PHOTO' && dataItem.imagesUri) {
        const baseName = getFilename(dataItem, 0, 'jpg').replace('.jpg', '')
        const photoFolderPath = `${targetFolder}/${baseName}`
        await Promise.all(
          dataItem.imagesUri.map(async (u, k) => {
            const { success } = await window.api.downloadFile({
              url: u,
              fileName: `${k + 1}.jpg`,
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
    } finally {
      pendingDownloadsRef.current--
      if (pendingDownloadsRef.current === 0 && isCancelledRef.current) {
        setIsProcessing(false)
      }
    }
  }

  const startProcessing = async (items: IDownloadItem[]) => {
    let targetFolder = folderPath
    if (!targetFolder) {
      targetFolder =
        (await window.api.getDefaultDownloadPath().then(({ data: path }) => path)) || ''
    }

    for (const item of items) {
      if (isCancelledRef.current) break

      setDownloadQueue((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'downloading' } : i))
      )

      try {
        const detailRes = await window.api.getAwemeDetails(item.originalUrl)
        if (!detailRes.success || !detailRes.data)
          throw new Error(detailRes.error || 'Fetch Failed')

        const dataItem = detailRes.data

        // Start download without waiting (fire and forget)
        pendingDownloadsRef.current++
        downloadItem(dataItem, item.id, targetFolder)
      } catch (e) {
        setDownloadQueue((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'error', error: (e as Error).message } : i
          )
        )
      }

      // Rate limit: 1 request per second for getAwemeDetails
      if (!isCancelledRef.current) {
        await delay(1000)
      }
    }

    // Wait for all pending downloads to complete
    const checkCompletion = () => {
      if (pendingDownloadsRef.current === 0) {
        setIsProcessing(false)
      } else {
        setTimeout(checkCompletion, 100)
      }
    }
    checkCompletion()
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

    const regex = /(?:video|photo)\/(\d+)/
    const lines = inputUrls.split(/[\n\s]+/).filter((l) => l.trim().length > 0)
    const newItems: IDownloadItem[] = []
    const seenIds = new Set()

    lines.forEach((l) => {
      const match = l.match(regex)
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

    startProcessing(newItems)
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
          </div>

          <Select
            classNames={{ label: 'mb-2' }}
            label="Filename Format"
            selectionMode="multiple"
            selectedKeys={fileNameFormat}
            onSelectionChange={(keys) => setFileNameFormat(keys as Set<string>)}
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
            <SelectItem key="ID">ID</SelectItem>
            <SelectItem key="Description">Description</SelectItem>
            <SelectItem key="Timestamp">Timestamp</SelectItem>
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
