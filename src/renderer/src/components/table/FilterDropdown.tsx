import {
  cn,
  Popover,
  Separator,
  PopoverContentProps,
  PopoverDialogProps,
  PopoverRootProps,
  PopoverTriggerProps,
  Button,
  ButtonProps
} from '@heroui/react'
import { FilterIcon, LucideProps } from 'lucide-react'
import React, { FC, SVGProps } from 'react'

interface IRenderContentProps {
  selectedValues: string[]
  setSelectedValues: React.Dispatch<React.SetStateAction<string[]>>
  confirm: () => void
  reset: () => void
}

interface IFilterDropdownProps {
  filteredValue: string[]
  filterIcon?: React.ComponentType<SVGProps<SVGSVGElement> & LucideProps>
  onFilter: (values: string[]) => void | Promise<void>
  popoverProps?: {
    root?: Omit<PopoverRootProps, 'children'>
    trigger?: PopoverTriggerProps
    content?: Omit<PopoverContentProps, 'children'>
    dialog?: PopoverDialogProps
  }
  confirmButtonProps?: ButtonProps
  resetButtonProps?: ButtonProps
  renderContent: (props: IRenderContentProps) => React.ReactNode
}

const FilterDropdown: FC<IFilterDropdownProps> = ({
  filteredValue,
  onFilter,
  popoverProps,
  renderContent,
  confirmButtonProps,
  resetButtonProps,
  filterIcon
}) => {
  const [selectedValues, setSelectedValues] = React.useState<string[]>([])
  const [isOpen, setIsOpen] = React.useState(false)

  const isFiltering = Array.isArray(filteredValue) && filteredValue.length > 0

  const normalizeSelectedValues = Array.isArray(selectedValues)
    ? selectedValues.filter(Boolean)
    : []

  const handleConfirm = () => {
    onFilter(normalizeSelectedValues)
    setIsOpen(false)
  }

  const handleReset = () => {
    setSelectedValues([])
    onFilter([])
    setIsOpen(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Sync local state with the current column filter value when opening
      const normalized = Array.isArray(filteredValue) ? filteredValue.filter(Boolean) : []
      setSelectedValues(normalized)
    }
    popoverProps?.root?.onOpenChange?.(open)
    setIsOpen(open)
  }

  return (
    <Popover {...popoverProps?.root} isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Popover.Trigger {...popoverProps?.trigger}>
        {React.createElement(filterIcon || FilterIcon, {
          size: 14,
          className: cn('hover:opacity-75 cursor-pointer', { 'text-blue-500': isFiltering })
        })}
      </Popover.Trigger>
      <Popover.Content className="max-w-48" {...popoverProps?.content}>
        <Popover.Dialog className="p-2" {...popoverProps?.dialog}>
          {renderContent({
            selectedValues: normalizeSelectedValues,
            setSelectedValues,
            confirm: handleConfirm,
            reset: handleReset
          })}
          <Separator className="my-2 mt-0" />
          <div className="flex gap-1">
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirm}
              className="flex-1"
              {...confirmButtonProps}
            >
              Confirm
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex-1"
              {...resetButtonProps}
            >
              Reset
            </Button>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  )
}

export default FilterDropdown
