import { useId } from 'react'
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

  const uniqueId = useId()
  const errorMessage = getFieldMessage(errors, name)
  const fieldId = inputId || inputProps.id || toInputId(name, uniqueId)
  const descriptionId = description ? `${fieldId}-description` : undefined
  const errorId = errorMessage ? `${fieldId}-error` : undefined
  const ariaDescribedBy = [inputProps['aria-describedby'], descriptionId, errorId].filter(Boolean).join(' ')

  return (
    <FormFieldLayout>
      {label ? (
        <FormLabel htmlFor={fieldId} required={required} className={hideLabel ? 'sr-only' : undefined}>
          {label}
        </FormLabel>
      ) : null}

      <Input
        {...register(name)}
        {...inputProps}
        id={fieldId}
        required={required}
        aria-invalid={Boolean(errorMessage) || inputProps['aria-invalid']}
        aria-describedby={ariaDescribedBy || undefined}
      />

      {description ? (
        <FormDescription id={descriptionId}>{description}</FormDescription>
      ) : null}

      {errorMessage ? <FormMessage id={errorId}>{errorMessage}</FormMessage> : null}
    </FormFieldLayout>
  )
}

export { RHFTextField }
