import { useFormContext } from 'react-hook-form'

import { Input } from '@/components/ui/index.js'

import {
  FormDescription,
  FormFieldLayout,
  FormLabel,
  FormMessage,
} from './FormFieldLayout.jsx'
import { getFieldMessage, toInputId } from './form-utils.js'

function RHFTextField({
  name,
  label,
  description,
  required = false,
  hideLabel = false,
  inputId,
  ...inputProps
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  const errorMessage = getFieldMessage(errors, name)
  const fieldId = inputId || toInputId(name)
  const descriptionId = description ? `${fieldId}-description` : undefined
  const errorId = errorMessage ? `${fieldId}-error` : undefined
  const ariaDescribedBy = [descriptionId, errorId].filter(Boolean).join(' ')

  return (
    <FormFieldLayout>
      {!hideLabel ? (
        <FormLabel htmlFor={fieldId} required={required}>
          {label}
        </FormLabel>
      ) : null}

      <Input
        id={fieldId}
        aria-invalid={Boolean(errorMessage)}
        aria-describedby={ariaDescribedBy || undefined}
        {...register(name)}
        {...inputProps}
      />

      {description ? (
        <FormDescription id={descriptionId}>{description}</FormDescription>
      ) : null}

      {errorMessage ? <FormMessage id={errorId}>{errorMessage}</FormMessage> : null}
    </FormFieldLayout>
  )
}

export { RHFTextField }
