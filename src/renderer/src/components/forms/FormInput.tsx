import { FieldError, Input, InputProps, Label, TextField, TextFieldProps } from '@heroui/react'
import { FC } from 'react'

interface IFormInputProps extends TextFieldProps {
  inputProps?: InputProps
  label?: string
  errorMessage?: string
}

const FormInput: FC<IFormInputProps> = ({ inputProps, label, errorMessage, ...rest }) => {
  return (
    <TextField {...rest}>
      {label && <Label>{label}</Label>}
      <Input {...inputProps} />
      <FieldError>{errorMessage}</FieldError>
    </TextField>
  )
}

export default FormInput
