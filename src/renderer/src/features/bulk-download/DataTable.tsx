import {
  Button,
  Checkbox,
  cn,
  EmptyState,
  NumberField,
  Popover,
  SortDescriptor,
  Table
} from '@heroui/react'
import {
  Header as HeaderType,
  OnChangeFn,
  PaginationState,
  Row,
  SortingState,
  Table as TableType
} from '@tanstack/table-core'
import { flexRender } from '@tanstack/react-table'
import { FC, memo, useCallback, useMemo, useState } from 'react'
import TablePagination from '@renderer/components/ui/Pagination'
import { ITiktokAwemeDetails } from '@minhchi1509/social-media-api/types'
import { ChevronDown } from 'lucide-react'

// ============================================================
// Types
// ============================================================

interface IDataTableProps {
  table: TableType<ITiktokAwemeDetails>
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
}

interface ITableHeaderProps {
  headers: HeaderType<ITiktokAwemeDetails, unknown>[]
  isAllPageRowsSelected: boolean
  isSomePageRowsSelected: boolean
  toggleAllPageRowsSelected: (value: boolean) => void
  onSelectAll: () => void
  onInvertCurrentPage: () => void
  onUnselectAll: () => void
}

interface ITableFooterProps {
  rowCount: number
  totalPages: number
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
}

// ============================================================
// Constants
// ============================================================

const PRESET_PAGE_SIZES = [10, 20, 50, 100] as const

const MIN_CUSTOM_PAGE_SIZE = 1
const MAX_CUSTOM_PAGE_SIZE = 500

// ============================================================
// Sub-components
// ============================================================

const TableHeader = ({
  headers,
  isAllPageRowsSelected,
  isSomePageRowsSelected,
  toggleAllPageRowsSelected,
  onSelectAll,
  onInvertCurrentPage,
  onUnselectAll
}: ITableHeaderProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const handleSelectionAction = useCallback((action: () => void) => {
    action()
    setIsPopoverOpen(false)
  }, [])

  return (
    <Table.Header className="sticky top-0 z-10">
      <Table.Column className="pr-0">
        <div className="flex items-center gap-0.5">
          <Checkbox
            aria-label="Select current page"
            slot={null}
            isSelected={isAllPageRowsSelected}
            isIndeterminate={isSomePageRowsSelected}
            onChange={(isSelected) => toggleAllPageRowsSelected(isSelected)}
          >
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
          </Checkbox>

          <Popover isOpen={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <Popover.Trigger>
              <ChevronDown
                size={14}
                className="cursor-pointer text-muted hover:text-foreground transition-colors"
              />
            </Popover.Trigger>
            <Popover.Content placement="bottom start" className="min-w-40">
              <Popover.Dialog className="p-1">
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start w-full"
                    onPress={() => handleSelectionAction(onSelectAll)}
                  >
                    Select all
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start w-full"
                    onPress={() => handleSelectionAction(onInvertCurrentPage)}
                  >
                    Invert current page
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start w-full"
                    onPress={() => handleSelectionAction(onUnselectAll)}
                  >
                    Unselect all
                  </Button>
                </div>
              </Popover.Dialog>
            </Popover.Content>
          </Popover>
        </div>
      </Table.Column>

      {headers.map((header) => (
        <Table.Column
          isRowHeader={header.id === 'id'}
          key={header.id}
          allowsSorting={header.column.getCanSort()}
          id={header.id}
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
        </Table.Column>
      ))}
    </Table.Header>
  )
}

const PageSizeSelector = memo(
  ({
    currentPageSize,
    onPageSizeChange
  }: {
    currentPageSize: number
    onPageSizeChange: (pageSize: number) => void
  }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [customValue, setCustomValue] = useState<number>(currentPageSize)

    const handleSelectPreset = useCallback(
      (size: number) => {
        onPageSizeChange(size)
        setIsOpen(false)
      },
      [onPageSizeChange]
    )

    const handleApplyCustom = useCallback(() => {
      if (customValue >= MIN_CUSTOM_PAGE_SIZE && customValue <= MAX_CUSTOM_PAGE_SIZE) {
        onPageSizeChange(customValue)
        setIsOpen(false)
      }
    }, [customValue, onPageSizeChange])

    const displayLabel = `${currentPageSize} / page`

    return (
      <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger>
          <Button variant="outline" size="sm" className="min-w-36 justify-between">
            {displayLabel}
            <ChevronDown size={14} />
          </Button>
        </Popover.Trigger>
        <Popover.Content placement="bottom end" className="w-48">
          <Popover.Dialog className="p-1">
            <div className="flex flex-col gap-1">
              {/* Preset options */}
              {PRESET_PAGE_SIZES.map((size) => (
                <Button
                  key={size}
                  variant={currentPageSize === size ? 'secondary' : 'ghost'}
                  size="sm"
                  className="justify-start w-full"
                  onPress={() => handleSelectPreset(size)}
                >
                  {size} / page
                </Button>
              ))}

              {/* Separator */}
              <div className="my-1 border-t border-default" />

              {/* Custom input */}
              <div className="flex flex-col gap-2 px-2 py-1.5">
                <span className="text-tiny font-medium text-muted">Custom</span>
                <NumberField
                  minValue={MIN_CUSTOM_PAGE_SIZE}
                  maxValue={MAX_CUSTOM_PAGE_SIZE}
                  value={customValue}
                  onChange={(val) => setCustomValue(val)}
                  aria-label="Custom page size"
                >
                  <NumberField.Group>
                    <NumberField.DecrementButton />
                    <NumberField.Input className="w-15" />
                    <NumberField.IncrementButton />
                  </NumberField.Group>
                </NumberField>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onPress={handleApplyCustom}
                  isDisabled={
                    customValue < MIN_CUSTOM_PAGE_SIZE || customValue > MAX_CUSTOM_PAGE_SIZE
                  }
                >
                  Apply
                </Button>
              </div>
            </div>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    )
  }
)

const TableFooter = memo(
  ({ rowCount, totalPages, pagination, onPaginationChange }: ITableFooterProps) => {
    const handlePageSizeChange = useCallback(
      (pageSize: number) => {
        onPaginationChange(() => ({ pageIndex: 0, pageSize }))
      },
      [onPaginationChange]
    )

    return (
      <div className="flex justify-between items-center mx-auto">
        <div>Total {rowCount} items</div>

        <TablePagination
          className="w-auto"
          totalPages={totalPages}
          currentPage={pagination.pageIndex}
          onPageChange={(pageIndex) => onPaginationChange((prev) => ({ ...prev, pageIndex }))}
        />

        <PageSizeSelector
          currentPageSize={pagination.pageSize}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    )
  }
)

// ============================================================
// Main Component
// ============================================================

const DataTable: FC<IDataTableProps> = ({
  table,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange
}) => {
  const sortDescriptor = useMemo<SortDescriptor | undefined>(() => {
    if (sorting.length === 0) return undefined
    return {
      column: sorting[0].id,
      direction: sorting[0].desc ? 'descending' : 'ascending'
    }
  }, [sorting])

  const handleSortChange = (descriptor: SortDescriptor) => {
    if (descriptor.column) {
      onSortingChange([
        {
          id: descriptor.column as string,
          desc: descriptor.direction === 'descending'
        }
      ])
    } else {
      onSortingChange([])
    }
  }

  // Selection handlers matching Ant Design's Table.SELECTION_* behavior
  const handleSelectAll = useCallback(() => {
    table.toggleAllRowsSelected(true)
  }, [table])

  const handleInvertCurrentPage = useCallback(() => {
    const currentPageRows: Row<ITiktokAwemeDetails>[] = table.getRowModel().rows
    currentPageRows.forEach((row) => {
      row.toggleSelected(!row.getIsSelected())
    })
  }, [table])

  const handleUnselectAll = useCallback(() => {
    table.toggleAllRowsSelected(false)
  }, [table])

  return (
    <Table className="my-5 shadow-md rounded-2xl border">
      <Table.ScrollContainer className="max-h-100 overflow-auto">
        <Table.Content
          className="h-full"
          sortDescriptor={sortDescriptor}
          onSortChange={handleSortChange}
        >
          <TableHeader
            headers={table.getHeaderGroups()[0]!.headers}
            isAllPageRowsSelected={table.getIsAllPageRowsSelected()}
            isSomePageRowsSelected={
              table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
            }
            toggleAllPageRowsSelected={table.toggleAllPageRowsSelected}
            onSelectAll={handleSelectAll}
            onInvertCurrentPage={handleInvertCurrentPage}
            onUnselectAll={handleUnselectAll}
          />
          <Table.Body
            renderEmptyState={() => (
              <EmptyState className="flex h-50 w-full flex-col items-center justify-center gap-4 text-center">
                <span className="text-sm text-muted">No results found</span>
              </EmptyState>
            )}
          >
            {table.getRowModel().rows.map((row) => (
              <Table.Row key={row.id} id={row.id}>
                <Table.Cell className={cn('pr-0', { 'bg-default': row.getIsSelected() })}>
                  <Checkbox
                    slot={null}
                    variant="secondary"
                    aria-label={`Select row ${row.id}`}
                    isSelected={row.getIsSelected()}
                    onChange={(isSelected) => row.toggleSelected(isSelected)}
                  >
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                  </Checkbox>
                </Table.Cell>
                {row.getVisibleCells().map((cell) => (
                  <Table.Cell key={cell.id} className={cn({ 'bg-default': row.getIsSelected() })}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
      <Table.Footer>
        <TableFooter
          rowCount={table.getRowCount()}
          totalPages={table.getPageCount()}
          pagination={pagination}
          onPaginationChange={onPaginationChange}
        />
      </Table.Footer>
    </Table>
  )
}

export default DataTable
