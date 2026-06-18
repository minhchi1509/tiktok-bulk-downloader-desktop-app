import { Checkbox } from '@heroui/react'
import { cn } from '@heroui/styles'
import { TSelectOption } from '@renderer/components/forms/FormSelect'
import FilterDropdown from '@renderer/components/table/FilterDropdown'
import { FC } from 'react'

interface ITableColumnFilterSelectProps {
  options: TSelectOption[]
  filteredValue: string[]
  onFilter: (value: string[]) => void
}

const TableColumnFilterSelect: FC<ITableColumnFilterSelectProps> = ({
  options,
  filteredValue,
  onFilter
}) => {
  return (
    <FilterDropdown
      filteredValue={filteredValue}
      onFilter={onFilter}
      renderContent={({ selectedValues, setSelectedValues }) => {
        return (
          <div className="flex flex-col gap-2 mb-2">
            {options.map((option) => {
              const isChecked = selectedValues.includes(option.value) ?? false

              return (
                <Checkbox
                  key={option.value}
                  id={`form-${option.value}`}
                  slot={null}
                  variant="secondary"
                  value={option.value}
                  isSelected={isChecked}
                  className={cn(
                    'hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md cursor-pointer px-2 py-1 duration-300',
                    isChecked &&
                      'bg-blue-200/75 hover:bg-blue-200 dark:bg-blue-600/50 dark:hover:bg-blue-600/60'
                  )}
                  onChange={(isSelected) => {
                    if (isSelected) {
                      setSelectedValues([...selectedValues, option.value])
                    } else {
                      setSelectedValues(selectedValues.filter((val) => val !== option.value))
                    }
                  }}
                >
                  <Checkbox.Content className="w-full">
                    <Checkbox.Control
                      className={cn(
                        'bg-transparent',
                        !isChecked && 'border border-zinc-300 dark:border-zinc-600'
                      )}
                    >
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <span className="text-black/70 dark:text-white font-medium">
                      {option.label}
                    </span>
                  </Checkbox.Content>
                </Checkbox>
              )
            })}
          </div>
        )
      }}
    />
  )
}

export default TableColumnFilterSelect
