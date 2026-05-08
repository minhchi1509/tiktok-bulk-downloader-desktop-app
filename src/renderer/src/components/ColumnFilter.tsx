import { Checkbox, cn, Popover, PopoverProps } from '@heroui/react'
import { TSelectOption } from '@renderer/components/forms/FormSelect'
import { FilterIcon } from 'lucide-react'
import { FC } from 'react'

interface IColumnFilterProps {
  options: TSelectOption[]
  columnName: string
  popoverProps?: PopoverProps
  filteredValue?: string[]
  onFilterChange?: (value: string[]) => void
}

export const ColumnFilter: FC<IColumnFilterProps> = ({
  columnName,
  popoverProps,
  filteredValue,
  onFilterChange,
  options
}) => {
  const isFiltered = Array.isArray(filteredValue) && filteredValue.length > 0

  return (
    <div className="flex justify-between w-full">
      <span>{columnName}</span>
      <Popover {...popoverProps}>
        <Popover.Trigger>
          <button type="button" aria-label={`Filter ${columnName}`}>
            <FilterIcon
              size={14}
              className={cn('hover:opacity-75 cursor-pointer', { 'text-blue-500': isFiltered })}
            />
          </button>
        </Popover.Trigger>
        <Popover.Content className="max-w-48">
          <div className="flex flex-col gap-2 p-2 rounded-2xl bg-white dark:bg-black">
            {options.map((option) => (
              <label
                htmlFor={`form-${option.value}`}
                key={option.value}
                className="flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md cursor-pointer px-2 py-1"
              >
                <Checkbox
                  id={`form-${option.value}`}
                  slot={null}
                  variant="secondary"
                  value={option.value}
                  isSelected={filteredValue?.includes(option.value)}
                  onChange={(isSelected) => {
                    if (isSelected) {
                      onFilterChange?.([...(filteredValue || []), option.value])
                    } else {
                      onFilterChange?.((filteredValue || []).filter((val) => val !== option.value))
                    }
                  }}
                >
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                </Checkbox>
                <Checkbox.Content>
                  <span className="text-muted font-medium">{option.label}</span>
                </Checkbox.Content>
              </label>
            ))}
          </div>
        </Popover.Content>
      </Popover>
    </div>
  )
}

export default ColumnFilter
