import {
  Button,
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
  Image,
  Chip,
  Tooltip
} from '@heroui/react'
import { useState, useEffect } from 'react'
import { FolderOpen, Download, Search, Save } from 'lucide-react'
import { IAwemeItem } from '@shared/types/tiktok.type'
import { showErrorToast } from '@renderer/lib/toast'

const SingleDownloader = () => {
  const [postId, setPostId] = useState('')
  const [sidTt, setSidTt] = useState('')
  const [folderPath, setFolderPath] = useState('')
  // Using Set for multi-select consistent with Bulk
  const [fileNameFormat, setFileNameFormat] = useState<Set<string>>(new Set(['ID']))
  const [loading, setLoading] = useState(false)
  const [downloadedItem, setDownloadedItem] = useState<IAwemeItem | null>(null)

  useEffect(() => {
    window.api.getDefaultDownloadPath().then(({ data: path }) => {
      if (path) setFolderPath(path)
    })
    // Load sid_tt setting
    window.api.getSettings('sid_tt').then(({ data: savedSid }) => {
      if (savedSid) setSidTt(savedSid)
    })
  }, [])

  const handleSaveSidTt = async () => {
    await window.api.saveSettings('sid_tt', sidTt)
  }

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

  const handleDownload = async () => {
    if (!postId) return
    setLoading(true)
    setDownloadedItem(null)
    try {
      const {
        success,
        data: item,
        error
      } = await window.api.getAwemeDetails(postId, {
        cookie: sidTt ? `sid_tt=${sidTt}` : ''
      })

      if (!success || !item) {
        showErrorToast(error)
        setLoading(false)
        return
      }

      let targetFolder = folderPath
      if (!targetFolder) {
        targetFolder =
          (await window.api.getDefaultDownloadPath().then(({ data: path }) => path)) || ''
        if (!targetFolder) {
          setLoading(false)
          return
        }
        setFolderPath(targetFolder)
      }

      if (item.type === 'VIDEO' && item.video) {
        await window.api.downloadFile({
          url: item.video.mp4Uri,
          fileName: getFilename(item, 0, 'mp4'),
          folderPath: targetFolder
        })
      } else if (item.type === 'PHOTO' && item.imagesUri) {
        // Create a folder for the photos
        const baseName = getFilename(item, 0, 'jpg').replace('.jpg', '')
        const photoFolderPath = `${targetFolder}/${baseName}`

        for (let j = 0; j < item.imagesUri.length; j++) {
          await window.api.downloadFile({
            url: item.imagesUri[j],
            fileName: `${j + 1}.jpg`,
            folderPath: photoFolderPath
          })
        }
      }

      setDownloadedItem(item)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto mt-10 p-6 bg-content1 rounded-xl shadow-lg border border-divider">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-secondary">
            Single Video Download
          </h2>
          <p className="text-default-500">Enter a video ID to download immediately.</p>
        </div>

        <Input
          label="Tiktok Video ID"
          placeholder="Enter video ID (e.g. 744900...)"
          value={postId}
          onValueChange={setPostId}
          variant="bordered"
          size="lg"
          startContent={<Search className="text-default-400" />}
        />

        <div className="flex gap-2 items-end">
          <Input
            label="sid_tt"
            placeholder="Optional. Required for private/restricted content."
            value={sidTt}
            onValueChange={setSidTt}
            variant="bordered"
            size="lg"
            className="flex-1"
            endContent={
              <Tooltip content="Save sid_tt for future use">
                <Button isIconOnly size="sm" variant="flat" onPress={handleSaveSidTt}>
                  <Save size={16} />
                </Button>
              </Tooltip>
            }
          />
        </div>
        <div className="flex gap-2 items-center text-tiny text-warning bg-warning-50 p-2 rounded-md border border-warning-200 dark:bg-warning-900/20 dark:border-warning-500/80">
          <span>
            ⚠️ How to get `sid_tt`: Login TikTok → F12 → Application → Cookies → Find `sid_tt` and
            copy its value.
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
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
            classNames={{
              label: 'mb-2'
            }}
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
          color="primary"
          isLoading={loading}
          onPress={handleDownload}
          className="w-full font-bold text-md"
          size="lg"
          startContent={!loading && <Download />}
        >
          {loading ? 'Processing...' : 'Download Now'}
        </Button>

        {downloadedItem && (
          <Card className="mt-4 bg-success-50 dark:bg-success-900/20 border-success-200">
            <CardBody className="flex flex-row gap-4 items-center">
              <Image
                src={downloadedItem.video?.coverUri || downloadedItem.imagesUri?.[0]}
                width={80}
                height={80}
                className="rounded-lg object-cover"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold">Download Complete!</span>
                  <Chip size="sm" color="success" variant="flat">
                    {downloadedItem.type}
                  </Chip>
                </div>
                <span className="text-small text-default-500 line-clamp-1">
                  {downloadedItem.description}
                </span>
                <span className="text-tiny text-default-400">ID: {downloadedItem.id}</span>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}

export default SingleDownloader
