import FilenameFormatSelect from '@renderer/components/forms/FilenameFormatSelect'
import FormInput from '@renderer/components/forms/FormInput'
import SavedLocationSelect from '@renderer/components/forms/SavedLocationSelect'
import { TDownloadOptions } from '@renderer/lib/schemas/download'
import { FC } from 'react'
import { Controller, useForm } from 'react-hook-form'

interface IDownloadOptionsProps {
  isDownloading?: boolean
  form: ReturnType<typeof useForm<TDownloadOptions>>
}

const DownloadOptions: FC<IDownloadOptionsProps> = ({ form, isDownloading }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-bold">Download options:</div>
      <div className="flex gap-2">
        <Controller
          control={form.control}
          name="saveLocation"
          render={({ field: { ref, ...fieldProps }, fieldState: { error, invalid } }) => (
            <SavedLocationSelect
              name={fieldProps.name}
              value={fieldProps.value}
              isDisabled={isDownloading}
              onFolderPathChange={(path) => fieldProps.onChange(path)}
              errorMessage={error?.message}
              isInvalid={invalid}
              className="grow"
            />
          )}
        />

        <Controller
          control={form.control}
          name="filenameFormat"
          render={({ field: { ref, ...fieldProps }, fieldState: { error, invalid } }) => (
            <FilenameFormatSelect
              name={fieldProps.name}
              value={fieldProps.value}
              isDisabled={isDownloading}
              onChange={(path) => fieldProps.onChange(path)}
              errorMessage={error?.message}
              isInvalid={invalid}
              className="w-100"
            />
          )}
        />

        <Controller
          control={form.control}
          name="concurrentDownloads"
          render={({ field: { ref, ...fieldProps }, fieldState: { error, invalid } }) => (
            <FormInput
              name={fieldProps.name}
              label="Download concurrency"
              value={String(fieldProps.value)}
              onChange={(val) => fieldProps.onChange(parseInt(val, 10))}
              isDisabled={isDownloading}
              errorMessage={error?.message}
              isInvalid={invalid}
              className="grow max-w-fit"
              inputProps={{
                type: 'number',
                variant: 'secondary',
                placeholder: 'Enter concurrent downloads'
              }}
            />
          )}
        />
      </div>
    </div>
  )
}

export default DownloadOptions
