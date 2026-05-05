import { cn, Popover, PopoverProps } from '@heroui/react'
import { Search, SearchIcon } from 'lucide-react'
import { FC, useRef } from 'react'

interface IColumnWithSearchProps {
  columnName: string
  popoverProps?: PopoverProps
  placeholder?: string
  searchText?: string
  onSearchChange?: (value: string) => void
}

const ColumnWithSearch: FC<IColumnWithSearchProps> = ({
  columnName,
  popoverProps,
  placeholder,
  searchText,
  onSearchChange
}) => {
  const isSearching = typeof searchText === 'string' && searchText.trim() !== ''
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex justify-between w-full">
      <span>{columnName}</span>
      <Popover
        {...popoverProps}
        onOpenChange={(isOpen) => {
          popoverProps?.onOpenChange?.(isOpen)
          // Force focus into the input after popover opens,
          // bypassing Table's focus scope that steals focus on empty state
          if (isOpen) {
            requestAnimationFrame(() => inputRef.current?.focus())
          }
        }}
      >
        <Popover.Trigger>
          <button type="button" aria-label={`Search ${columnName}`}>
            <SearchIcon
              size={14}
              className={cn('hover:opacity-75 cursor-pointer', isSearching && 'text-blue-500')}
            />
          </button>
        </Popover.Trigger>
        <Popover.Content className="max-w-64">
          <Popover.Dialog className="p-2">
            <div className="flex items-center gap-2">
              <Search size={14} className="shrink-0" />
              <input
                ref={inputRef}
                type="text"
                autoFocus
                className="outline-none bg-transparent text-sm w-full"
                value={searchText ?? ''}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={placeholder}
              />
            </div>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    </div>
  )
}

export default ColumnWithSearch
