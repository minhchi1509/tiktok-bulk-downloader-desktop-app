import { Select, Label, Chip, ListBox, SelectProps, FieldError } from '@heroui/react'
import { TFileNameFormatOption } from '@shared/utils/tiktok.util'

const DEFAULT_FILE_NAME_FORMAT_OPTIONS: Array<{ value: TFileNameFormatOption; label: string }> = [
  { value: 'numericalOrder', label: 'Numerical Order' },
  { value: 'id', label: 'ID' },
  { value: 'title', label: 'Description' },
  { value: 'timestamp', label: 'Timestamp' }
]

interface IFilenameFormatSelectProps<T extends object = object> extends SelectProps<T, 'multiple'> {
  errorMessage?: string
  options?: Array<{ value: TFileNameFormatOption; label: string }>
}

const FilenameFormatSelect = ({
  errorMessage,
  options = DEFAULT_FILE_NAME_FORMAT_OPTIONS,
  ...selectProps
}: IFilenameFormatSelectProps) => {
  return (
    <Select
      variant="secondary"
      selectionMode="multiple"
      placeholder="Select file name format"
      isRequired
      {...selectProps}
    >
      <Label>Filename format</Label>
      <Select.Trigger>
        <Select.Value>
          {({ defaultChildren, isPlaceholder, state }) => {
            if (isPlaceholder || state.selectedItems.length === 0) {
              return defaultChildren
            }
            const selectedItems = state.selectedItems

            return (
              <div className="flex flex-wrap items-center gap-1">
                {selectedItems.map((item, index) => (
                  <div key={item.key} className="flex items-center gap-1">
                    <Chip size="sm" variant="primary" color="accent">
                      {item.textValue}
                    </Chip>

                    {/* separator "_" (không render cho item cuối) */}
                    {index < selectedItems.length - 1 && <span>_</span>}
                  </div>
                ))}
              </div>
            )
          }}
        </Select.Value>
        <Select.Indicator />
      </Select.Trigger>
      <FieldError>{errorMessage}</FieldError>
      <Select.Popover>
        <ListBox selectionMode="multiple">
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

export default FilenameFormatSelect
