import {
  DateField,
  DateRangePickerProps,
  FieldError,
  DateRangePicker as HeroDateRangePicker,
  I18nProvider,
  Label,
  RangeCalendar
} from '@heroui/react'
import { DateValue } from '@internationalized/date'
import React from 'react'

interface IDateRangePickerProps extends DateRangePickerProps<DateValue> {
  label?: string
  errorMessage?: string
}

const DateRangePicker: React.FC<IDateRangePickerProps> = ({ label, errorMessage, ...props }) => {
  return (
    <I18nProvider locale="en-GB">
      <HeroDateRangePicker {...props}>
        {label && <Label>{label}</Label>}
        <DateField.Group fullWidth>
          <DateField.Input slot="start">
            {(segment) => <DateField.Segment segment={segment} />}
          </DateField.Input>
          <HeroDateRangePicker.RangeSeparator />
          <DateField.Input slot="end">
            {(segment) => <DateField.Segment segment={segment} />}
          </DateField.Input>
          <DateField.Suffix>
            <HeroDateRangePicker.Trigger>
              <HeroDateRangePicker.TriggerIndicator />
            </HeroDateRangePicker.Trigger>
          </DateField.Suffix>
        </DateField.Group>
        {errorMessage && <FieldError>{errorMessage}</FieldError>}
        <HeroDateRangePicker.Popover>
          <RangeCalendar aria-label="Date Range Calendar">
            <RangeCalendar.Header>
              <RangeCalendar.YearPickerTrigger>
                <RangeCalendar.YearPickerTriggerHeading />
                <RangeCalendar.YearPickerTriggerIndicator />
              </RangeCalendar.YearPickerTrigger>
              <RangeCalendar.NavButton slot="previous" />
              <RangeCalendar.NavButton slot="next" />
            </RangeCalendar.Header>
            <RangeCalendar.Grid>
              <RangeCalendar.GridHeader>
                {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
              </RangeCalendar.GridHeader>
              <RangeCalendar.GridBody>
                {(date) => <RangeCalendar.Cell date={date} />}
              </RangeCalendar.GridBody>
            </RangeCalendar.Grid>
            <RangeCalendar.YearPickerGrid>
              <RangeCalendar.YearPickerGridBody>
                {({ year }) => <RangeCalendar.YearPickerCell year={year} />}
              </RangeCalendar.YearPickerGridBody>
            </RangeCalendar.YearPickerGrid>
          </RangeCalendar>
        </HeroDateRangePicker.Popover>
      </HeroDateRangePicker>
    </I18nProvider>
  )
}

export default DateRangePicker
