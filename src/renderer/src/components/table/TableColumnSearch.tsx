import FilterDropdown from '@renderer/components/table/FilterDropdown'
import { Search, SearchIcon } from 'lucide-react'
import React, { FC } from 'react'

interface ITableColumnSearchProps {
  placeholder?: string
  filteredValue: string[]
  onFilter: (value: string[]) => void
}

const TableColumnSearch: FC<ITableColumnSearchProps> = ({
  placeholder,
  filteredValue,
  onFilter
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <FilterDropdown
      filteredValue={filteredValue}
      onFilter={onFilter}
      filterIcon={SearchIcon}
      popoverProps={{
        root: {
          onOpenChange: (isOpen) => {
            if (isOpen) {
              requestAnimationFrame(() => inputRef.current?.focus())
            }
          }
        }
      }}
      renderContent={({ confirm, selectedValues, setSelectedValues }) => {
        return (
          <div className="flex items-center gap-2 p-2">
            <Search size={14} className="shrink-0" />
            <input
              ref={inputRef}
              type="text"
              autoFocus
              className="outline-none bg-transparent text-sm w-full"
              value={selectedValues[0] ?? ''}
              onChange={(e) => setSelectedValues([e.target.value])}
              placeholder={placeholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  confirm()
                }
              }}
            />
          </div>
        )
      }}
    />
  )
}

export default TableColumnSearch
