import { Checkbox, cn, EmptyState, SortDescriptor, Table } from '@heroui/react'
import {
  Header as HeaderType,
  OnChangeFn,
  PaginationState,
  SortingState,
  Table as TableType
} from '@tanstack/table-core'
import { flexRender } from '@tanstack/react-table'
import { FC, memo, useMemo } from 'react'
import TablePagination from '@renderer/components/ui/Pagination'
import FormSelect, { TSelectOption } from '@renderer/components/forms/FormSelect'
import { ITiktokAwemeDetails } from '@minhchi1509/social-media-api/types'

interface IDataTableProps {
  table: TableType<ITiktokAwemeDetails>
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
}

interface ITableHeaderProps {
  headers: HeaderType<ITiktokAwemeDetails, unknown>[]
  isAllRowsSelected: boolean
  isSomeRowsSelected: boolean
  toggleAllRowsSelected: (value: boolean) => void
}

interface ITableFooterProps {
  rowCount: number
  totalPages: number
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
}

const TableHeader = ({
  headers,
  isAllRowsSelected,
  isSomeRowsSelected,
  toggleAllRowsSelected
}: ITableHeaderProps) => {
  return (
    <Table.Header className="sticky top-0 z-10">
      <Table.Column className="pr-0">
        <Checkbox
          aria-label="Select all"
          slot={null}
          isSelected={isAllRowsSelected}
          isIndeterminate={isSomeRowsSelected}
          onChange={(isSelected) => toggleAllRowsSelected(isSelected)}
        >
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
        </Checkbox>
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

const TABLE_PAGE_SIZE_OPTIONS: TSelectOption[] = [
  { label: '10 / page', value: 10 },
  { label: '20 / page', value: 20 },
  { label: '50 / page', value: 50 },
  { label: '100 / page', value: 100 }
]

const TableFooter = memo(
  ({ rowCount, totalPages, pagination, onPaginationChange }: ITableFooterProps) => {
    return (
      <div className="flex justify-between items-center mx-auto">
        <div>Total {rowCount} items</div>

        <TablePagination
          className="w-auto"
          totalPages={totalPages}
          currentPage={pagination.pageIndex}
          onPageChange={(pageIndex) => onPaginationChange((prev) => ({ ...prev, pageIndex }))}
        />

        <FormSelect
          options={TABLE_PAGE_SIZE_OPTIONS}
          value={pagination.pageSize}
          onChange={(val) => onPaginationChange(() => ({ pageIndex: 0, pageSize: Number(val) }))}
          className="w-40"
        />
      </div>
    )
  }
)

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
            isAllRowsSelected={table.getIsAllRowsSelected()}
            isSomeRowsSelected={table.getIsSomeRowsSelected()}
            toggleAllRowsSelected={table.toggleAllRowsSelected}
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
