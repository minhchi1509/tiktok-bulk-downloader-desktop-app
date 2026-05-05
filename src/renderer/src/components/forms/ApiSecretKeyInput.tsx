import { FieldError, Input, Label, TextField, TextFieldProps } from '@heroui/react'
import { EAppSettingKey } from '@shared/constants/enum'
import { FC, useEffect, useState } from 'react'
import { useDebounceValue } from 'usehooks-ts'

interface IApiSecretKeyInputProps extends TextFieldProps {
  errorMessage?: string
}

const ApiSecretKeyInput: FC<IApiSecretKeyInputProps> = ({ errorMessage, onChange, ...props }) => {
  const [apiSecretKey, setApiSecretKey] = useState('')
  const [debouncedApiSecretKey] = useDebounceValue(apiSecretKey, 500)

  const handleApiSecretKeyChange = (value: string) => {
    setApiSecretKey(value)
    onChange?.(value)
  }

  useEffect(() => {
    const loadInitialSettings = async () => {
      const savedApiSecretKeyResult = await window.api.getSettings<string>(
        EAppSettingKey.API_SECRET_KEY
      )

      if (savedApiSecretKeyResult?.success && typeof savedApiSecretKeyResult.data === 'string') {
        onChange?.(savedApiSecretKeyResult.data)
        setApiSecretKey(savedApiSecretKeyResult.data)
      }
    }

    loadInitialSettings()
  }, [])

  useEffect(() => {
    if (!debouncedApiSecretKey) return

    const saveApiSecretKey = async () => {
      try {
        await window.api.saveSettings(EAppSettingKey.API_SECRET_KEY, debouncedApiSecretKey.trim())
      } catch {}
    }

    saveApiSecretKey()
  }, [debouncedApiSecretKey])

  return (
    <TextField onChange={handleApiSecretKeyChange} isRequired {...props}>
      <Label>API Secret Key</Label>
      <Input variant="secondary" />
      <FieldError>{errorMessage}</FieldError>
    </TextField>
  )
}

export default ApiSecretKeyInput
