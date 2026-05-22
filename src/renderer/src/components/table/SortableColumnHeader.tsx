import { cn } from '@heroui/styles'
import { SortDirection } from '@tanstack/react-table'
import { ChevronUp } from 'lucide-react'
import { FC } from 'react'

interface ISortableColumnHeaderProps {
  sortDirection: SortDirection | false | undefined
}

const SortableColumnHeader: FC<ISortableColumnHeaderProps> = ({ sortDirection }) => {
  return !!sortDirection ? (
    <ChevronUp
      className={cn(
        'size-3 transform transition-transform duration-300 ease-out',
        sortDirection === 'desc' ? 'rotate-180' : ''
      )}
    />
  ) : null
}

export default SortableColumnHeader
