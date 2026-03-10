import { Controller, useFormContext } from 'react-hook-form'

import { Checkbox } from '@/components/ui/index.js'

import {
  FormDescription,
  FormFieldLayout,
  FormLabel,
  FormMessage,
} from './FormFieldLayout.jsx'
import { getFieldMessage, toInputId } from './form-utils.js'

function RHFCheckboxField({
  name,
  label,
  description,
  required = false,
  inputId,
  className,
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext()

  const errorMessage = getFieldMessage(errors, name)
  const fieldId = inputId || toInputId(name)
  const descriptionId = description ? `${fieldId}-description` : undefined
  const errorId = errorMessage ? `${fieldId}-error` : undefined
  const ariaDescribedBy = [descriptionId, errorId].filter(Boolean).join(' ')

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormFieldLayout className={className}>
          <div className="flex items-start gap-sm">
            <Checkbox
              id={fieldId}
              name={field.name}
              checked={Boolean(field.value)}
              onCheckedChange={(nextChecked) => field.onChange(Boolean(nextChecked))}
              onBlur={field.onBlur}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={ariaDescribedBy || undefined}
              ref={field.ref}
            />

            <div className="space-y-2xs">
              <FormLabel htmlFor={fieldId} required={required}>
                {label}
              </FormLabel>

              {description ? (
                <FormDescription id={descriptionId}>{description}</FormDescription>
              ) : null}
            </div>
          </div>

          {errorMessage ? <FormMessage id={errorId}>{errorMessage}</FormMessage> : null}
        </FormFieldLayout>
      )}
    />
  )
}

export { RHFCheckboxField }
