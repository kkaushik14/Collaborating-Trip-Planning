import { useId } from 'react'
import { useFormContext } from 'react-hook-form'

import { Textarea } from '@/components/ui/index.js'

import {
  FormDescription,
  FormFieldLayout,
  FormLabel,
  FormMessage,
} from './FormFieldLayout.jsx'
import { getFieldMessage, toInputId } from './form-utils.js'

function RHFTextareaField({
  name,
  label,
  description,
  required = false,
  hideLabel = false,
  inputId,
  ...textareaProps
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  const uniqueId = useId()
  const errorMessage = getFieldMessage(errors, name)
  const fieldId = inputId || textareaProps.id || toInputId(name, uniqueId)
  const descriptionId = description ? `${fieldId}-description` : undefined
  const errorId = errorMessage ? `${fieldId}-error` : undefined
  const ariaDescribedBy = [textareaProps['aria-describedby'], descriptionId, errorId].filter(Boolean).join(' ')

  return (
    <FormFieldLayout>
      {label ? (
        <FormLabel htmlFor={fieldId} required={required} className={hideLabel ? 'sr-only' : undefined}>
          {label}
        </FormLabel>
      ) : null}

      <Textarea
        {...register(name)}
        {...textareaProps}
        id={fieldId}
        required={required}
        aria-invalid={Boolean(errorMessage) || textareaProps['aria-invalid']}
        aria-describedby={ariaDescribedBy || undefined}
      />

      {description ? (
        <FormDescription id={descriptionId}>{description}</FormDescription>
      ) : null}

      {errorMessage ? <FormMessage id={errorId}>{errorMessage}</FormMessage> : null}
    </FormFieldLayout>
  )
}

export { RHFTextareaField }
