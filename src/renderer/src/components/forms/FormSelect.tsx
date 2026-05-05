import { SelectProps, Select, ListBox } from '@heroui/react'
import { FC } from 'react'

export type TSelectOption = {
  label: string
  value: any
}

interface IFormSelectProps<T extends object = object> extends SelectProps<T> {
  options: TSelectOption[]
}

const FormSelect: FC<IFormSelectProps> = ({ options, ...selectProps }) => {
  return (
    <Select {...selectProps}>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item key={option.value} id={option.value} textValue={option.label}>
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  )
}

export default FormSelect
