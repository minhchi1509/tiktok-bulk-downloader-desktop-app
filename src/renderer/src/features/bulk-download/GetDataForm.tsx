import { Button } from '@heroui/react'
import { TGetAwemeListInput } from '@renderer/lib/schemas/download'
import { Search, StopCircle } from 'lucide-react'
import { FC } from 'react'
import { Controller, useForm } from 'react-hook-form'
import FormInput from '@renderer/components/forms/FormInput'
import ApiSecretKeyInput from '@renderer/components/forms/ApiSecretKeyInput'

interface IGetDataFormProps {
  form: ReturnType<typeof useForm<TGetAwemeListInput>>
  isGettingData: boolean
  onSubmit: (formValue: TGetAwemeListInput) => void | Promise<void>
}

const GetDataForm: FC<IGetDataFormProps> = ({ form, isGettingData, onSubmit }) => {
  const { control, handleSubmit } = form

  return (
    <div className="flex gap-4">
      <Controller
        control={form.control}
        name="username"
        render={({ field: { ref, ...fieldProps }, fieldState: { error, invalid } }) => (
          <FormInput
            label="Username"
            isRequired
            className="grow"
            isDisabled={isGettingData}
            isInvalid={invalid}
            errorMessage={error?.message}
            inputProps={{
              placeholder: 'Enter username',
              variant: 'secondary'
            }}
            {...fieldProps}
          />
        )}
      />
      <Controller
        control={control}
        name="apiSecretKey"
        render={({ field: { ref, ...fieldProps }, fieldState: { error, invalid } }) => (
          <ApiSecretKeyInput
            isRequired
            isDisabled={isGettingData}
            isInvalid={invalid}
            className="grow"
            errorMessage={error?.message}
            {...fieldProps}
          />
        )}
      />
      <Controller
        control={control}
        name="delayBetweenRequests"
        render={({ field: { ref, ...fieldProps }, fieldState: { error, invalid } }) => (
          <FormInput
            name={fieldProps.name}
            value={String(fieldProps.value)}
            onChange={(val) => fieldProps.onChange(Number(val))}
            label="Delay between requests (seconds)"
            className="grow max-w-fit"
            isDisabled={isGettingData}
            isInvalid={invalid}
            errorMessage={error?.message}
            inputProps={{
              type: 'number',
              placeholder: 'Enter delay in seconds',
              variant: 'secondary'
            }}
          />
        )}
      />
      <Button
        className="min-w-fit grow self-end"
        variant={isGettingData ? 'danger' : 'primary'}
        onPress={() => handleSubmit(onSubmit)()}
      >
        {!isGettingData ? <Search size={18} /> : <StopCircle size={18} />}
        {isGettingData ? 'Stop' : 'Get Data'}
      </Button>
    </div>
  )
}

export default GetDataForm
