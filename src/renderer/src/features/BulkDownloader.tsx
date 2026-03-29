import {
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  Progress,
  Tooltip,
  Pagination,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  SortDescriptor,
  Selection,
  ScrollShadow
} from '@heroui/react'
import {
  SortingState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  FilterFn,
  RowSelectionState
} from '@tanstack/react-table'
import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { IAwemeDetails, IUserInfo } from '@shared/types/tiktok.type'
import { promisePool } from '@shared/utils/common.util'
import {
  Search,
  Download,
  FolderOpen,
  StopCircle,
  ExternalLink,
  AlertCircle,
  Save,
  Loader2
} from 'lucide-react'
import tiktokUtils, { TFileNameFormatOption } from '@shared/utils/tiktok.util'
import { showErrorToast, showSuccessToast } from '@renderer/lib/toast'

const columnHelper = createColumnHelper<IAwemeDetails>()
const TIKTOK_COOKIE_SETTINGS_KEY = 'tiktok_cookie'

const FILE_NAME_FORMAT_OPTIONS: Array<{ key: TFileNameFormatOption; label: string }> = [
  { key: 'numericalOrder', label: 'Numerical Order' },
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Description' },
  { key: 'timestamp', label: 'Timestamp' }
]

const BulkDownloader = () => {
  const [username, setUsername] = useState('')
  const [delay, setDelay] = useState('0')
  const [batchSize, setBatchSize] = useState('15')
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState<IUserInfo | null>(null)
  const [posts, setPosts] = useState<IAwemeDetails[]>([])

  // Fetch State
  const isCancelGetDataRef = useRef(false)
  const isCancelDownloadRef = useRef(false)

  // Table State
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<{ id: string; value: unknown }[]>([])

  // Pagination State
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Download State
  const [folderPath, setFolderPath] = useState('')
  // Using Set to handle multiple selections for filename format
  const [fileNameFormat, setFileNameFormat] = useState<Set<TFileNameFormatOption>>(
    new Set(['numericalOrder', 'id'])
  )
  const [tiktokCookie, setTiktokCookie] = useState('')
  const [isSavingCookie, setIsSavingCookie] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [failedItems, setFailedItems] = useState<{ item: IAwemeDetails; error: string }[]>([])
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 })

  // Custom Filter Function
  const customFilterFn: FilterFn<IAwemeDetails> = (row, columnId, filterValue) => {
    const rowValue = row.getValue(columnId) as string
    if (!filterValue) return true
    return String(rowValue).toLowerCase().includes(String(filterValue).toLowerCase())
  }

  const columns = useMemo(
    () => [
      // Removed manual checkbox column as HeroUI handles it
      columnHelper.accessor('id', {
        id: 'id',
        header: 'ID',
        // Enable column filtering
        filterFn: customFilterFn,
        enableSorting: false,
        cell: (info) => <span className="text-small font-bold">{info.getValue()}</span>
      }),
      columnHelper.accessor('type', {
        id: 'type',
        header: 'Type',
        filterFn: (row, id, value) => {
          return !value || value === 'ALL' || row.getValue(id) === value
        },
        enableSorting: false,
        cell: (info) => (
          <Chip
            size="sm"
            color={info.getValue() === 'VIDEO' ? 'primary' : 'secondary'}
            variant="flat"
          >
            {info.getValue()}
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
        header: 'Description',
        filterFn: customFilterFn,
        enableSorting: false,
        cell: (info) => (
          <Tooltip content={info.getValue()} delay={1000}>
            <div className="w-40 truncate text-tiny cursor-default">{info.getValue()}</div>
          </Tooltip>
        )
      }),
      columnHelper.accessor('createdAt', {
        id: 'createdAt',
        header: 'Created At',
        enableSorting: true,
        cell: (info) => (
          <span className="text-tiny text-default-500">
            {info.getValue() ? new Date(info.getValue() * 1000).toLocaleString() : '-'}
          </span>
        )
      }),
      columnHelper.accessor('stats.likes', {
        id: 'likes',
        header: 'Likes',
        enableSorting: true,
        cell: (info) => (
          <span className="text-tiny">❤️ {Number(info.getValue()).toLocaleString()}</span>
        )
      }),
      columnHelper.accessor('stats.comments', {
        id: 'comments',
        header: 'Comments',
        enableSorting: true,
        cell: (info) => (
          <span className="text-tiny">💬 {Number(info.getValue()).toLocaleString()}</span>
        )
      }),
      columnHelper.accessor('stats.views', {
        id: 'views',
        header: 'Views',
        enableSorting: true,
        cell: (info) => (
          <span className="text-tiny">👁️ {Number(info.getValue()).toLocaleString()}</span>
        )
      }),
      columnHelper.accessor('stats.collects', {
        id: 'collects',
        header: 'Collects',
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
      pagination: {
        pageIndex,
        pageSize
      }
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({ pageIndex, pageSize })
        setPageIndex(newState.pageIndex)
        setPageSize(newState.pageSize)
      } else {
        setPageIndex(updater.pageIndex)
        setPageSize(updater.pageSize)
      }
    },
    enableRowSelection: true
  })

  // HeroUI Table Interop
  const sortDescriptor = useMemo<SortDescriptor | undefined>(() => {
    if (sorting.length === 0) return undefined
    return {
      column: sorting[0].id,
      direction: sorting[0].desc ? 'descending' : 'ascending'
    }
  }, [sorting])

  const handleSortChange = (descriptor: SortDescriptor) => {
    if (descriptor.column) {
      setSorting([
        {
          id: descriptor.column as string,
          desc: descriptor.direction === 'descending'
        }
      ])
    } else {
      setSorting([])
    }
  }

  const selectedKeys = useMemo<Selection>(() => {
    if (table.getIsAllRowsSelected()) return 'all'
    const keys = Object.keys(rowSelection).filter((key) => rowSelection[key])
    if (keys.length === 0) return new Set([])
    return new Set(keys)
  }, [rowSelection, table])

  const handleSelectionChange = (keys: Selection) => {
    if (keys === 'all') {
      table.toggleAllRowsSelected(true)
    } else {
      // If we switched from all to some, or just some to some
      // When keys is a Set, it contains the selected row IDs
      const newSelection = {}
      keys.forEach((key) => {
        newSelection[key] = true
      })
      setRowSelection(newSelection)
    }
  }

  // Fetch Logic
  const handleFetchData = async () => {
    if (!username) {
      showErrorToast('Please provide a username')
      return
    }

    // Toggle Loading
    if (loading) {
      // User clicked cancel
      isCancelGetDataRef.current = true
      setLoading(false)
      return
    }

    setLoading(true)
    isCancelGetDataRef.current = false

    setPosts([])
    setPageIndex(0)

    try {
      const cookie = tiktokCookie.trim()
      const requestOptions = cookie ? { cookie } : undefined

      const { data: user, success, error } = await window.api.getUserInfo(username, requestOptions)

      if (!success || !user) {
        showErrorToast(error)
        setLoading(false)
        return
      }
      setUserInfo(user)

      let currentCursor = '0'
      let currentMaxCursor = '0'
      let hasMore = true

      while (hasMore && !isCancelGetDataRef.current) {
        const { success, data: res } = await window.api.getUserAwemeList(user.secUid, {
          cursor: currentCursor,
          maxCursor: currentMaxCursor,
          ...(requestOptions || {})
        })

        if (!success || !res) {
          showErrorToast('Failed to fetch user posts')
          break
        }

        if (res.pagination.hasMore && res.awemeList.length === 0) {
          showErrorToast('No more posts available or unable to fetch more posts.')
          break
        }

        setPosts((prev) => [...prev, ...res.awemeList])
        currentCursor = res.pagination.cursor
        currentMaxCursor = res.pagination.maxCursor
        hasMore = res.pagination.hasMore

        // Handling delay
        const delayMs = (parseInt(delay) || 0) * 1000
        if (delayMs > 0 && hasMore) await new Promise((r) => setTimeout(r, delayMs))
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  // Fetch default path and saved cookie on mount
  useEffect(() => {
    const loadInitialSettings = async () => {
      const [{ data: path }, savedCookieResult] = await Promise.all([
        window.api.getDefaultDownloadPath(),
        window.api.getSettings<string>(TIKTOK_COOKIE_SETTINGS_KEY)
      ])

      if (path) {
        setFolderPath(path)
      }

      if (savedCookieResult?.success && typeof savedCookieResult.data === 'string') {
        setTiktokCookie(savedCookieResult.data)
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

  const handleDownload = async () => {
    // Get sorted and selected rows
    const sortedRows = table.getSortedRowModel().rows
    const selectedRows = sortedRows.filter((row) => row.getIsSelected())

    if (selectedRows.length === 0) {
      alert('Please select items to download')
      return
    }

    let currentFolderPath = folderPath
    if (!currentFolderPath) {
      const { data: defaultPath } = await window.api.selectFolder()
      if (!defaultPath) return
      currentFolderPath = defaultPath
      setFolderPath(currentFolderPath)
    }

    setDownloading(true)
    setFailedItems([])
    isCancelDownloadRef.current = false
    setDownloadProgress({ current: 0, total: selectedRows.length })

    const safeUsername = tiktokUtils.getFilename({
      id: userInfo?.uniqueId || username || 'unknown_user',
      format: ['id']
    })
    const userFolderPath = `${currentFolderPath}/${safeUsername}`

    const maxConcurrency = Math.max(1, parseInt(batchSize) || 1)
    const currentFailedItems: { item: IAwemeDetails; error: string }[] = []

    await promisePool({
      items: selectedRows,
      concurrency: maxConcurrency,
      worker: async (row, globalIndex) => {
        if (isCancelDownloadRef.current) return

        const item = row.original

        try {
          if (item.type === 'VIDEO' && item.video) {
            const filename = tiktokUtils.getFilename({
              order: globalIndex + 1,
              id: item.id,
              title: item.description,
              timestamp: item.createdAt,
              format: Array.from(fileNameFormat)
            })
            const { success } = await window.api.downloadFile({
              url: item.video.mp4Uri,
              fileName: `${filename}.mp4`,
              folderPath: userFolderPath
            })
            if (!success) {
              throw new Error('Failed to download video')
            }
          } else if (item.type === 'PHOTO' && item.imagesUri) {
            // Download photos for a single post concurrently
            await Promise.all(
              item.imagesUri.map(async (imgUrl, imgIndex) => {
                const filename = tiktokUtils.getFilename({
                  order: `${globalIndex + 1}-${imgIndex + 1}`,
                  id: item.id,
                  title: item.description,
                  timestamp: item.createdAt,
                  format: Array.from(fileNameFormat)
                })
                const { success } = await window.api.downloadFile({
                  url: imgUrl,
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
          const failedItem = { item, error: (e as Error).message }
          currentFailedItems.push(failedItem)
          setFailedItems((prev) => [...prev, failedItem])
        } finally {
          setDownloadProgress((prev) => ({ ...prev, current: prev.current + 1 }))
        }
      }
    })

    if (currentFailedItems.length > 0) {
      showErrorToast(`Completed with ${currentFailedItems.length} errors.`)
    }

    setDownloading(false)
  }

  const handleStopDownload = () => {
    isCancelDownloadRef.current = true
    setDownloading(false)
  }

  const handleSelectFolder = async () => {
    const { data: path } = await window.api.selectFolder()
    if (path) setFolderPath(path)
  }

  const renderTopContent = useCallback(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-small text-default-500 flex items-center h-full">
          <div className="flex flex-col gap-2">
            <p>
              Username: <b>{userInfo?.uniqueId || ''}</b>
            </p>
            <p>Total posts: {posts.length || 0}</p>
          </div>
        </div>

        <div className="h-divider w-full bg-divider" />

        <div className="flex flex-col gap-2">
          <div className="text-sm font-bold text-default-500">Download options:</div>
          <div className="flex gap-2 items-center">
            <Tooltip delay={0} content={folderPath} placement="top" isDisabled={!folderPath}>
              <Input
                label="Save Location"
                value={folderPath}
                readOnly
                size="sm"
                className="w-64"
                classNames={{
                  input: 'truncate'
                }}
                endContent={
                  <FolderOpen
                    size={16}
                    className="cursor-pointer hover:text-primary"
                    onClick={handleSelectFolder}
                  />
                }
              />
            </Tooltip>

            <Input
              label="TikTok Cookie (optional)"
              value={tiktokCookie}
              onValueChange={setTiktokCookie}
              className="w-96"
              size="sm"
              endContent={
                <button
                  type="button"
                  aria-label="Save TikTok cookie"
                  onClick={handleSaveCookie}
                  disabled={isSavingCookie || !tiktokCookie.trim()}
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

            <Select
              label="Filename Format"
              selectionMode="multiple"
              selectedKeys={fileNameFormat}
              onSelectionChange={(keys) => setFileNameFormat(keys as Set<TFileNameFormatOption>)}
              className="w-96"
              size="sm"
              classNames={{
                label: 'mb-2'
              }}
              renderValue={(items) => (
                <div className="flex flex-wrap items-center gap-1">
                  {items.map((item, index) => (
                    <div key={item.key} className="flex items-center gap-1">
                      <Chip size="sm" variant="flat" color="primary">
                        {item.textValue}
                      </Chip>

                      {/* separator "_" (không render cho item cuối) */}
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

            <Input
              label="Download concurrency"
              value={batchSize}
              onValueChange={setBatchSize}
              className="grow max-w-xs"
              type="number"
              size="sm"
              isDisabled={loading}
            />
          </div>
        </div>

        <div className="h-divider w-full bg-divider" />

        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex gap-2 items-center flex-1">
            {/* ID Search Filter */}
            <Input
              placeholder="Filter ID..."
              value={(table.getColumn('id')?.getFilterValue() as string) ?? ''}
              onValueChange={(val) => table.getColumn('id')?.setFilterValue(val)}
              startContent={<Search size={14} />}
              size="sm"
              className="max-w-sm"
            />
            {/* Description Search Filter */}
            <Input
              placeholder="Filter Description..."
              value={(table.getColumn('description')?.getFilterValue() as string) ?? ''}
              onValueChange={(val) => table.getColumn('description')?.setFilterValue(val)}
              startContent={<Search size={14} />}
              size="sm"
              className="max-w-sm"
            />
            {/* Type Filter */}
            <Select
              placeholder="Type"
              size="sm"
              className="w-24"
              selectedKeys={[(table.getColumn('type')?.getFilterValue() as string) || 'ALL']}
              onChange={(e) => table.getColumn('type')?.setFilterValue(e.target.value)}
            >
              <SelectItem key="ALL">All</SelectItem>
              <SelectItem key="VIDEO">Video</SelectItem>
              <SelectItem key="PHOTO">Photo</SelectItem>
            </Select>
          </div>

          {/* Download Configuration */}
          <div className="flex gap-2 items-center">
            <Button
              size="sm"
              color={downloading ? 'danger' : 'primary'}
              onPress={downloading ? handleStopDownload : handleDownload}
              startContent={downloading ? <StopCircle size={16} /> : <Download size={16} />}
              isDisabled={Object.keys(rowSelection).length === 0}
            >
              {downloading ? `Stop` : `Download (${Object.keys(rowSelection).length})`}
            </Button>
          </div>
        </div>
        {downloading && (
          <div className="w-full px-1">
            <div className="flex justify-between text-tiny mb-1">
              <span>Downloading...</span>
              <span>
                {downloadProgress.current} / {downloadProgress.total}
              </span>
            </div>
            <Progress
              value={(downloadProgress.current / downloadProgress.total) * 100}
              size="sm"
              color="success"
              className="w-full"
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
                {failedItems.map(({ item, error }, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="flex justify-between items-start text-tiny gap-2"
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-bold text-danger-600 dark:text-danger-400 font-mono">
                        {item.id}
                      </span>
                      <span className="truncate text-default-500">{item.description}</span>
                    </div>
                    <span className="text-danger whitespace-nowrap ml-2">{error}</span>
                  </div>
                ))}
              </div>
            </ScrollShadow>
          </div>
        )}
      </div>
    )
  }, [
    table,
    folderPath,
    tiktokCookie,
    fileNameFormat,
    isSavingCookie,
    downloading,
    downloadProgress,
    rowSelection,
    columns,
    userInfo,
    posts.length,
    batchSize,
    loading,
    failedItems
  ])

  const renderBottomContent = useCallback(() => {
    return (
      <div className="flex justify-between items-center p-2 rounded-lg border border-divider">
        <div className="text-small text-default-500">Total {posts.length} items</div>

        <Pagination
          showControls
          total={table.getPageCount()}
          initialPage={1}
          page={pageIndex + 1}
          onChange={(page) => setPageIndex(page - 1)}
          siblings={1}
          boundaries={1}
        />

        <Select
          size="sm"
          className="w-36"
          selectedKeys={[String(pageSize)]}
          onChange={(e) => setPageSize(Number(e.target.value))}
          aria-label="Rows per page"
        >
          <SelectItem key="10">10 / page</SelectItem>
          <SelectItem key="20">20 / page</SelectItem>
          <SelectItem key="50">50 / page</SelectItem>
          <SelectItem key="100">100 / page</SelectItem>
        </Select>
      </div>
    )
  }, [posts.length, table, pageIndex, pageSize])

  return (
    <div className="flex flex-col gap-4 h-full relative p-2">
      {/* Input Section */}
      <div className="flex flex-col gap-4 bg-content1 p-4 rounded-lg shadow-sm border border-divider">
        <div className="flex gap-4 items-end">
          <Input
            label="Username"
            value={username}
            onValueChange={setUsername}
            className="max-w-max"
            variant="bordered"
            size="sm"
            isDisabled={loading}
          />

          <Input
            label="Delay between requests (seconds)"
            value={delay}
            onValueChange={setDelay}
            className="grow max-w-xs"
            type="number"
            variant="bordered"
            size="sm"
            isDisabled={loading}
            placeholder="0"
          />

          <Button
            className="min-w-fit grow"
            color={loading ? 'danger' : 'primary'}
            onPress={handleFetchData}
            startContent={!loading ? <Search size={18} /> : <StopCircle size={18} />}
          >
            {loading ? 'Stop' : 'Get Data'}
          </Button>
        </div>
      </div>

      {/* Main Content: HeroUI Table */}
      <div className="flex gap-4 h-full overflow-hidden rounded-lg shadow-sm border border-divider p-4">
        <Table
          aria-label="Bulk Downloader Table"
          isHeaderSticky
          removeWrapper
          bottomContent={renderBottomContent()}
          bottomContentPlacement="outside"
          topContent={renderTopContent()}
          topContentPlacement="outside"
          classNames={{
            wrapper: 'h-full shadow-sm border border-divider',
            base: 'h-full overflow-hidden'
          }}
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={handleSelectionChange}
          sortDescriptor={sortDescriptor}
          onSortChange={handleSortChange}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.id}
                align={column.id === 'actions' ? 'end' : 'start'}
                allowsSorting={column.enableSorting}
              >
                {column.header as string}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={table.getRowModel().rows}
            emptyContent={loading ? 'Fetching...' : 'No data found'}
          >
            {(row) => (
              <TableRow key={row.original.id}>
                {(columnKey) => (
                  <TableCell>
                    {flexRender(
                      row.getVisibleCells().find((cell) => cell.column.id === columnKey)?.column
                        .columnDef.cell,
                      row
                        .getVisibleCells()
                        .find((cell) => cell.column.id === columnKey)
                        ?.getContext()!
                    )}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default BulkDownloader
