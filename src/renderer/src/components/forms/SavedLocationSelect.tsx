import { FieldError, InputGroup, Label, TextField, TextFieldProps } from '@heroui/react'
import { FolderOpen } from 'lucide-react'
import { FC, useEffect } from 'react'

interface ISavedLocationSelectProps extends TextFieldProps {
  folderPath?: string
  errorMessage?: string
  onFolderPathChange?: (path: string) => void
}

const SavedLocationSelect: FC<ISavedLocationSelectProps> = ({
  folderPath,
  onFolderPathChange,
  errorMessage,
  ...props
}) => {
  const handleSelectFolder = async () => {
    const { data: path } = await window.api.selectFolder()
    if (path) onFolderPathChange?.(path)
  }

  useEffect(() => {
    const loadDefaultFolderPath = async () => {
      const { data: defaultPath } = await window.api.getDefaultDownloadPath()
      if (defaultPath) {
        onFolderPathChange?.(defaultPath)
      }
    }

    loadDefaultFolderPath()
  }, [])

  return (
    <TextField value={folderPath} isReadOnly isRequired {...props}>
      <Label>Save location</Label>
      <InputGroup variant="secondary">
        <InputGroup.Input className="truncate w-full" />
        <InputGroup.Suffix>
          <FolderOpen size={16} className="cursor-pointer" onClick={handleSelectFolder} />
        </InputGroup.Suffix>
      </InputGroup>
      <FieldError>{errorMessage}</FieldError>
    </TextField>
  )
}

export default SavedLocationSelect
