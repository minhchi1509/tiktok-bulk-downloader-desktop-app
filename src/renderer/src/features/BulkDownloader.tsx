import { Button, Chip, Tooltip, ScrollShadow, Separator, Card, cn } from '@heroui/react'
import {
  SortingState,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  FilterFn,
  RowSelectionState,
  PaginationState
} from '@tanstack/react-table'
import { useState, useMemo, useRef, useCallback } from 'react'
import { promisePool } from '@shared/utils/common.util'
import { Download, StopCircle, ExternalLink, AlertCircle } from 'lucide-react'
import tiktokUtils, { TFileNameFormatOption } from '@shared/utils/tiktok.util'
import { showErrorToast } from '@renderer/lib/utils/toast'
import type { ITiktokAwemeDetails, ITiktokUserDetails } from '@minhchi1509/social-media-api/types'
import GetDataForm from '@renderer/features/bulk-download/GetDataForm'
import {
  downloadOptionsSchema,
  getAwemeListSchema,
  TDownloadOptions,
  TGetAwemeListInput
} from '@renderer/lib/schemas/download'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import DownloadOptions from '@renderer/features/bulk-download/DownloadOptions'
import dayjs from 'dayjs'
import DataTable from '@renderer/features/bulk-download/DataTable'
import ProgressBar from '@renderer/components/ui/ProgressBar'
import TableColumnSearch from '@renderer/components/table/TableColumnSearch'
import TableColumnFilterSelect from '@renderer/components/table/TableColumnFilterSelect'
import SortableColumnHeader from '@renderer/components/table/SortableColumnHeader'
import TableDateRangeFilter from '@renderer/components/table/TableDateRangeFilter'

const columnHelper = createColumnHelper<ITiktokAwemeDetails>()

const BulkDownloader = () => {
  const [isGettingData, setIsGettingData] = useState(false)
  const [userInfo, setUserInfo] = useState<ITiktokUserDetails | null>(null)
  const [posts, setPosts] = useState<ITiktokAwemeDetails[]>([])

  // Fetch State
  const isCancelGetDataRef = useRef(false)
  const isCancelDownloadRef = useRef(false)

  // Table State
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [columnFilters, setColumnFilters] = useState<{ id: string; value: unknown }[]>([])

  // Using Set to handle multiple selections for filename forma
  const [downloadStatus, setDownloadStatus] = useState<
    'idle' | 'downloading' | 'completed' | 'cancelled'
  >('idle')
  const [failedItems, setFailedItems] = useState<ITiktokAwemeDetails[]>([])
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 })

  const isDownloading = downloadStatus === 'downloading'
  const showDownloadProgress =
    isDownloading || (!isCancelDownloadRef.current && downloadStatus === 'completed')

  // Custom Filter Function
  const customFilterFn: FilterFn<ITiktokAwemeDetails> = (row, columnId, filterValue) => {
    const rowValue = row.getValue(columnId) as string
    if (!filterValue || filterValue.length === 0) return true
    return rowValue.toLowerCase().includes((filterValue[0] as string).toLowerCase())
  }

  const columns = useMemo(
    () => [
      // Removed manual checkbox column as HeroUI handles it
      columnHelper.accessor('id', {
        id: 'id',
        header: ({ column }) => (
          <div className="flex justify-between w-full">
            <span>ID</span>
            <TableColumnSearch
              placeholder="Search ID..."
              filteredValue={column.getFilterValue() as string[]}
              onFilter={(val) => column.setFilterValue(val)}
            />
          </div>
        ),
        // Enable column filtering
        filterFn: customFilterFn,
        enableSorting: false,
        cell: (info) => <span className="text-small font-bold">{info.getValue()}</span>
      }),
      columnHelper.accessor('contentType', {
        id: 'contentType',
        header: ({ column }) => (
          <div className="flex justify-between w-full">
            <span>Content Type</span>
            <TableColumnFilterSelect
              options={[
                { value: 'VIDEO', label: 'Video' },
                { value: 'MULTI_PHOTO', label: 'Multi photo' }
              ]}
              filteredValue={column.getFilterValue() as string[]}
              onFilter={(val) => column.setFilterValue(val)}
            />
          </div>
        ),
        filterFn: (row, id, value: string[]) => {
          return value?.includes(row.getValue(id)) || value.length === 0
        },
        enableSorting: false,
        cell: (info) => (
          <Chip
            size="sm"
            color={info.getValue() === 'VIDEO' ? 'accent' : 'success'}
            variant="primary"
          >
            <Chip.Label className="text-white">{info.getValue()}</Chip.Label>
          </Chip>
        )
      }),
      columnHelper.accessor('url', {
        id: 'url',
        header: 'Url',
        enableSorting: false,
        cell: (info) => (
          <a
            href={info.getValue()}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:text-primary-500"
          >
            <ExternalLink size={16} />
          </a>
        )
      }),
      columnHelper.accessor('description', {
        id: 'description',
        header: ({ column }) => (
          <div className="flex justify-between w-full">
            <span>Description</span>
            <TableColumnSearch
              placeholder="Search Description..."
              filteredValue={column.getFilterValue() as string[]}
              onFilter={(val) => column.setFilterValue(val)}
            />
          </div>
        ),
        filterFn: customFilterFn,
        enableSorting: false,
        cell: (info) => (
          <Tooltip delay={0}>
            <span
              role="button"
              tabIndex={0}
              className="block w-40 truncate text-tiny cursor-default"
            >
              {info.getValue()}
            </span>
            <Tooltip.Content className="max-w-80" showArrow>
              <Tooltip.Arrow />
              {info.getValue()}
            </Tooltip.Content>
          </Tooltip>
        )
      }),
      columnHelper.accessor('createdAt', {
        id: 'createdAt',
        header: ({ column }) => {
          return (
            <div className="flex w-full justify-between items-center">
              <span>Created At</span>
              <div className="flex gap-1 items-center">
                <TableDateRangeFilter
                  filteredValue={column.getFilterValue() as string[]}
                  onFilter={(val) => column.setFilterValue(val)}
                />
                <SortableColumnHeader sortDirection={column.getIsSorted()} />
              </div>
            </div>
          )
        },
        enableSorting: true,
        filterFn: (row, columnId, filterValue) => {
          const rowValue = Number(row.getValue(columnId))
          if (!filterValue || filterValue.length === 0) return true

          const [startStr, endStr] = filterValue[0].split(',')
          const startTs = parseInt(startStr, 10)
          const endTs = parseInt(endStr, 10)

          if (isNaN(startTs) || isNaN(endTs)) return true

          return rowValue >= startTs && rowValue <= endTs
        },
        cell: (info) => (
          <span>{dayjs.unix(info.getValue() as number).format('DD/MM/YYYY HH:mm:ss')}</span>
        )
      }),
      columnHelper.accessor('statistics.diggCount', {
        id: 'likes',
        header: ({ column }) => {
          return (
            <div className="flex w-full justify-between items-center">
              <span>Likes</span>
              <SortableColumnHeader sortDirection={column.getIsSorted()} />
            </div>
          )
        },
        enableSorting: true,
        cell: (info) => (
          <span className="text-tiny">❤️ {Number(info.getValue()).toLocaleString()}</span>
        )
      }),
      columnHelper.accessor('statistics.commentCount', {
        id: 'comments',
        header: ({ column }) => {
          return (
            <div className="flex w-full justify-between items-center">
              <span>Comments</span>
              <SortableColumnHeader sortDirection={column.getIsSorted()} />
            </div>
          )
        },
        enableSorting: true,
        cell: (info) => (
          <span className="text-tiny">💬 {Number(info.getValue()).toLocaleString()}</span>
        )
      }),
      columnHelper.accessor('statistics.playCount', {
        id: 'views',
        header: ({ column }) => {
          return (
            <div className="flex w-full justify-between items-center">
              <span>Views</span>
              <SortableColumnHeader sortDirection={column.getIsSorted()} />
            </div>
          )
        },
        enableSorting: true,
        cell: (info) => (
          <span className="text-tiny">👁️ {Number(info.getValue()).toLocaleString()}</span>
        )
      }),
      columnHelper.accessor('statistics.collectCount', {
        id: 'collects',
        header: ({ column }) => {
          return (
            <div className="flex w-full justify-between items-center">
              <span>Collects</span>
              <SortableColumnHeader sortDirection={column.getIsSorted()} />
            </div>
          )
        },
        enableSorting: true,
        cell: (info) => (
          <span className="text-tiny">📌 {Number(info.getValue()).toLocaleString()}</span>
        )
      })
    ],
    []
  )

  const table = useReactTable({
    data: posts,
    columns,
    getRowId: (row) => row.id, // Important for selection
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      rowSelection,
      columnFilters,
      pagination
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    enableRowSelection: true
  })

  // Fetch Logic
  const handleFetchData = async (formValue: TGetAwemeListInput) => {
    // Toggle Loading
    if (isGettingData) {
      // User clicked cancel
      isCancelGetDataRef.current = true
      setIsGettingData(false)
      return
    }

    setIsGettingData(true)
    isCancelGetDataRef.current = false

    setDownloadStatus('idle')
    setPosts([])
    setFailedItems([])
    setPagination({ pageIndex: 0, pageSize: 10 })

    try {
      const userInfoResponse = await window.api.getUserInfo(formValue.username)
      if (!userInfoResponse.success) {
        throw new Error(userInfoResponse.error || 'Failed to fetch user info')
      }
      const userInfo = userInfoResponse.data
      setUserInfo(userInfo)

      let currentMinCursor = '0'
      let currentMaxCursor = '0'
      let hasMore = true

      while (hasMore && !isCancelGetDataRef.current) {
        const getUserAwemeListResponse = await window.api.getUserAwemeList({
          secUid: userInfo.secUid,
          minCursor: currentMinCursor,
          maxCursor: currentMaxCursor
        })

        if (!getUserAwemeListResponse.success) {
          throw new Error(getUserAwemeListResponse.error || 'Failed to fetch aweme list')
        }

        setPosts((prev) => [...prev, ...getUserAwemeListResponse.data.awemeList])

        currentMinCursor = getUserAwemeListResponse.data.pagination.minCursor
        currentMaxCursor = getUserAwemeListResponse.data.pagination.maxCursor
        hasMore = getUserAwemeListResponse.data.pagination.hasMore

        // Handling delay
        const delayMs = formValue.delayBetweenRequests * 1000
        if (delayMs > 0 && hasMore) await new Promise((r) => setTimeout(r, delayMs))
      }
    } catch (error) {
      showErrorToast((error as Error).message)
    } finally {
      setIsGettingData(false)
    }
  }

  const getAwemeListForm = useForm<TGetAwemeListInput>({
    resolver: zodResolver(getAwemeListSchema),
    defaultValues: {
      username: '',
      apiSecretKey: '',
      delayBetweenRequests: 0
    }
  })

  const downloadOptionsForm = useForm<TDownloadOptions>({
    resolver: zodResolver(downloadOptionsSchema),
    defaultValues: {
      saveLocation: '',
      filenameFormat: ['numericalOrder', 'id'] as TFileNameFormatOption[],
      concurrentDownloads: 15
    }
  })

  const handleDownload = async (formValues: TDownloadOptions) => {
    const { filenameFormat, saveLocation, concurrentDownloads } = formValues

    // Get sorted and selected rows
    const sortedRows = table.getSortedRowModel().rows
    const selectedRows = sortedRows.filter((row) => row.getIsSelected())

    if (selectedRows.length === 0) {
      showErrorToast('Please select items to download')
      return
    }

    setDownloadStatus('downloading')
    setFailedItems([])
    isCancelDownloadRef.current = false
    setDownloadProgress({ current: 0, total: selectedRows.length })

    const safeUsername = tiktokUtils.getFilename({
      id: userInfo?.uniqueId,
      format: ['id']
    })
    const userFolderPath = `${saveLocation}/${safeUsername}`

    const maxConcurrency = Math.max(1, concurrentDownloads)

    await promisePool({
      items: selectedRows,
      concurrency: maxConcurrency,
      worker: async (row, globalIndex) => {
        if (isCancelDownloadRef.current) return

        const item = row.original

        try {
          if (item.contentType === 'VIDEO' && item.video) {
            const filename = tiktokUtils.getFilename({
              order: globalIndex + 1,
              id: item.id,
              title: item.description,
              timestamp: item.createdAt,
              format: Array.from(filenameFormat as TFileNameFormatOption[])
            })
            const { success } = await window.api.downloadFile({
              url: item.video.hdPlayUrlList[0] || '',
              fileName: `${filename}.mp4`,
              folderPath: userFolderPath
            })
            if (!success) {
              throw new Error('Failed to download video')
            }
          } else if (item.contentType === 'MULTI_PHOTO' && item.imagePost) {
            // Download photos for a single post concurrently
            await Promise.all(
              item.imagePost.images.map(async (img, imgIndex) => {
                const filename = tiktokUtils.getFilename({
                  order: `${globalIndex + 1}-${imgIndex + 1}`,
                  id: item.id,
                  title: item.description,
                  timestamp: item.createdAt,
                  format: Array.from(filenameFormat as TFileNameFormatOption[])
                })
                const { success } = await window.api.downloadFile({
                  url: img.urlList[0] || '',
                  fileName: `${filename}.jpg`,
                  folderPath: userFolderPath
                })
                if (!success) {
                  throw new Error('Failed to download photo')
                }
              })
            )
          }
        } catch (e) {
          setFailedItems((prev) => [...prev, item])
        } finally {
          setDownloadProgress((prev) => ({ ...prev, current: prev.current + 1 }))
        }
      }
    })

    setDownloadStatus('completed')
  }

  const handleStopDownload = () => {
    isCancelDownloadRef.current = true
    setDownloadStatus('cancelled')
  }

  const renderTopContent = useCallback(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center h-full text-sm">
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-zinc-600 dark:text-zinc-400">
              Username:{' '}
              <span className="text-black dark:text-white font-bold">
                {userInfo?.uniqueId || ''}
              </span>
            </p>
            <p className="font-semibold text-zinc-600 dark:text-zinc-400">
              Total posts:{' '}
              <span className="text-black dark:text-white font-bold">{posts.length || 0}</span>
            </p>
          </div>
        </div>

        <Separator />

        <DownloadOptions isDownloading={isDownloading} form={downloadOptionsForm} />

        <Separator className="my-2" />

        <div className="flex justify-between items-center flex-wrap gap-2">
          {/* Download Configuration */}
          <div className="flex gap-2 items-center">
            <Button
              size="sm"
              variant={isDownloading ? 'danger' : 'primary'}
              onPress={
                isDownloading
                  ? handleStopDownload
                  : () => downloadOptionsForm.handleSubmit(handleDownload)()
              }
              isDisabled={Object.keys(rowSelection).length === 0}
            >
              {isDownloading ? <StopCircle size={16} /> : <Download size={16} />}
              {isDownloading ? `Stop` : `Download (${Object.keys(rowSelection).length})`}
            </Button>
          </div>
        </div>
        {showDownloadProgress && (
          <div className="w-full px-1">
            <ProgressBar
              color={isDownloading ? 'accent' : 'success'}
              value={(downloadProgress.current / downloadProgress.total) * 100}
              outputProps={{
                className: cn(isDownloading ? '' : 'text-success')
              }}
              label={() =>
                isDownloading ? (
                  `Downloading... (${downloadProgress.current} / ${downloadProgress.total})`
                ) : (
                  <span className="text-success">Download completed</span>
                )
              }
            />
          </div>
        )}

        {failedItems.length > 0 && (
          <div className="w-full mt-2">
            <div className="flex gap-2 items-center mb-1 text-danger">
              <AlertCircle size={16} />
              <span className="font-bold text-small">Failed Downloads ({failedItems.length})</span>
            </div>
            <ScrollShadow
              className="h-30 w-full border border-danger-200 rounded-lg p-2 bg-danger-50 dark:bg-danger-900/20"
              visibility="none"
            >
              <div className="flex flex-col gap-2">
                {failedItems.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="font-bold text-danger-600 dark:text-danger-400 font-mono"
                  >
                    <span>{idx + 1}</span>. {item.id}
                  </div>
                ))}
              </div>
            </ScrollShadow>
          </div>
        )}
      </div>
    )
  }, [isDownloading, downloadProgress, rowSelection, userInfo, posts.length, failedItems])

  return (
    <div className="flex flex-col gap-4 h-full relative p-2">
      {/* Input Section */}
      <Card className="border">
        <Card.Content>
          <GetDataForm
            form={getAwemeListForm}
            isGettingData={isGettingData}
            onSubmit={handleFetchData}
          />
        </Card.Content>
      </Card>

      {/* Main Content: HeroUI Table */}
      <Card className="border">
        <Card.Content>
          {renderTopContent()}
          <DataTable
            table={table}
            sorting={sorting}
            onSortingChange={setSorting}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        </Card.Content>
      </Card>
    </div>
  )
}

export default BulkDownloader
