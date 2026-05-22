import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'
import FilterDropdown from '@renderer/components/table/FilterDropdown'
import DateRangePicker from '@renderer/components/ui/DateRangePicker'
import dayjs from 'dayjs'
import React, { useCallback } from 'react'

interface ITableDateRangeFilterProps {
  filteredValue: string[]
  onFilter: (value: string[]) => void
}

const TableDateRangeFilter: React.FC<ITableDateRangeFilterProps> = ({
  filteredValue,
  onFilter
}) => {
  const parseTimestampRange = useCallback((str: string | null | undefined) => {
    if (!str) return null

    const [startTs, endTs] = str.split(',').map((t) => parseInt(t.trim(), 10))

    if (!startTs || !endTs) return null

    const startDate = new Date(startTs * 1000)
    const endDate = new Date(endTs * 1000)

    return {
      start: new CalendarDate(
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        startDate.getDate()
      ),
      end: new CalendarDate(endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate())
    }
  }, [])

  // DateRangePicker value → String timestamp
  const formatToTimestampRange = useCallback((value: { start: any; end: any } | null): string => {
    if (!value?.start || !value?.end) return ''

    const startTs = dayjs(value.start.toString()).unix() // unix() trả về giây
    const endTs = dayjs(value.end.toString()).unix()

    return `${startTs},${endTs}`
  }, [])

  return (
    <FilterDropdown
      popoverProps={{
        content: {
          className: 'w-fit'
        }
      }}
      filteredValue={filteredValue}
      onFilter={onFilter}
      renderContent={({ selectedValues, setSelectedValues }) => {
        return (
          <DateRangePicker
            className="mb-2"
            maxValue={today(getLocalTimeZone())}
            value={parseTimestampRange(selectedValues[0])}
            onChange={(value) => setSelectedValues([formatToTimestampRange(value)])}
          />
        )
      }}
    />
  )
}

export default TableDateRangeFilter
