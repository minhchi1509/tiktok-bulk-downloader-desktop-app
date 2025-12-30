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
  Selection
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
import { IAwemeItem, IUserInfo } from '@shared/types/tiktok.type'
import { Search, Download, FolderOpen, StopCircle, ExternalLink, Save } from 'lucide-react'
import { showErrorToast, showSuccessToast } from '@renderer/lib/toast'

const columnHelper = createColumnHelper<IAwemeItem>()

const BulkDownloader = () => {
  const [username, setUsername] = useState('')
  const [sidTt, setSidTt] = useState('')
  const [delay, setDelay] = useState('0')
  const [batchSize, setBatchSize] = useState('15')
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState<IUserInfo | null>(null)
  const [posts, setPosts] = useState<IAwemeItem[]>([])

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
  const [fileNameFormat, setFileNameFormat] = useState<Set<string>>(
    new Set(['Numerical order', 'ID'])
  )
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 })

  // Load sid_tt from settings
  useEffect(() => {
    window.api.getSettings('sid_tt').then(({ data: savedSid }) => {
      if (savedSid) setSidTt(savedSid)
    })
  }, [])

  const handleSaveSidTt = async () => {
    await window.api.saveSettings('sid_tt', sidTt)
    showSuccessToast('sid_tt saved successfully!')
  }

  // Custom Filter Function
  const customFilterFn: FilterFn<IAwemeItem> = (row, columnId, filterValue) => {
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
    if (!username) return

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
      const { data: user, success, error } = await window.api.getUserInfo(username)

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
          cookie: sidTt ? `sid_tt=${sidTt}` : undefined
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

  // Fetch default path on mount
  useState(() => {
    window.api.getDefaultDownloadPath().then(({ data: path }) => {
      if (path) setFolderPath(path)
    })
  })

  // Download Logic
  const sanitizeFilename = (name: string) => {
    // Allow Vietnamese characters and other unicode, just strip illegal Windows chars < > : " / \ | ? *
    return name
      ? name
          .replace(/[<>:"/\\|?*]+/g, '')
          .trim()
          .substring(0, 100)
      : 'no_desc'
  }

  const getFilename = (item: IAwemeItem, index: number, ext: string) => {
    const formatKeys = Array.from(fileNameFormat)

    const parts: string[] = []

    formatKeys.forEach((key) => {
      if (key === 'Numerical order') parts.push(`${index + 1}`)
      if (key === 'ID') parts.push(item.id)
      if (key === 'Timestamp') parts.push(item.createdAt.toString())
      if (key === 'Description') parts.push(sanitizeFilename(item.description))
    })

    return parts.length > 0 ? `${parts.join('_')}.${ext}` : `${item.id}.${ext}`
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
    isCancelDownloadRef.current = false
    setDownloadProgress({ current: 0, total: selectedRows.length })

    const safeUsername = sanitizeFilename(userInfo?.uniqueId || username || 'unknown_user')
    const userFolderPath = `${currentFolderPath}/${safeUsername}`

    // Batch processing
    const batchSizeNum = parseInt(batchSize) || 1

    for (let i = 0; i < selectedRows.length; i += batchSizeNum) {
      if (isCancelDownloadRef.current) break

      const batch = selectedRows.slice(i, i + batchSizeNum)

      const downloadPromises = batch.map(async (row, batchIndex) => {
        const item = row.original
        const globalIndex = i + batchIndex

        try {
          if (item.type === 'VIDEO' && item.video) {
            await window.api.downloadFile({
              url: item.video.mp4Uri,
              fileName: getFilename(item, globalIndex, 'mp4'),
              folderPath: userFolderPath
            })
          } else if (item.type === 'PHOTO' && item.imagesUri) {
            const baseName = getFilename(item, globalIndex, 'jpg').replace('.jpg', '')
            const photoFolderPath = `${userFolderPath}/${baseName}`

            // Download photos for a single post concurrently
            await Promise.all(
              item.imagesUri.map((imgUrl, j) =>
                window.api.downloadFile({
                  url: imgUrl,
                  fileName: `${j + 1}.jpg`,
                  folderPath: photoFolderPath
                })
              )
            )
          }
        } catch (e) {
          console.error(`Failed to download ${item.id}`, e)
        } finally {
          setDownloadProgress((prev) => ({ ...prev, current: prev.current + 1 }))
        }
      })

      await Promise.all(downloadPromises)
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

            <Select
              label="Filename Format"
              selectionMode="multiple"
              selectedKeys={fileNameFormat}
              onSelectionChange={(keys) => setFileNameFormat(keys as Set<string>)}
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
              <SelectItem key="Numerical order">Numerical Order</SelectItem>
              <SelectItem key="ID">ID</SelectItem>
              <SelectItem key="Description">Description</SelectItem>
              <SelectItem key="Timestamp">Timestamp</SelectItem>
            </Select>

            <Input
              label="Download concurrency (batch size)"
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
      </div>
    )
  }, [
    table,
    folderPath,
    fileNameFormat,
    downloading,
    downloadProgress,
    rowSelection,
    columns,
    userInfo,
    posts.length,
    batchSize,
    loading
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
            label="sid_tt"
            value={sidTt}
            onValueChange={setSidTt}
            className="max-w-md"
            variant="bordered"
            size="sm"
            isDisabled={loading}
            placeholder="Optional"
            endContent={
              <Tooltip content="Save sid_tt for future use">
                <Button isIconOnly size="sm" variant="flat" onPress={handleSaveSidTt}>
                  <Save size={16} />
                </Button>
              </Tooltip>
            }
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

        <div className="flex gap-2 items-center text-tiny text-warning bg-warning-50 p-2 rounded-md border border-warning-200 dark:bg-warning-900/20 dark:border-warning-500/80">
          <span>
            ⚠️ Note: Provide `sid_tt` if the user has audience controls enabled (login required).
            How to get: Login TikTok → F12 → Application → Cookies → sid_tt.
          </span>
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
