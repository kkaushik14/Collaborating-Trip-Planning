import { AlertTriangleIcon } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { useFormContext } from 'react-hook-form'

import { TravelLoader } from '../components/common/index.js'
import { Form } from '../components/forms/index.js'
import { readFormDraft } from '../components/forms/form-utils.js'
import { Button } from '../components/ui/index.js'
import { Heading, Text } from '../components/typography/index.js'

function PageLoadingState({ title = 'Loading data...', description = 'Please wait while we fetch the latest trip data.' }) {
  return (
    <section role="status" className="flex min-w-0 min-h-[calc(100vh-10rem)] items-center justify-center px-sm py-lg sm:px-md">
      <div className="surface-card min-w-0 w-full max-w-xl p-md sm:p-2xl">
        <TravelLoader title={title} description={description} />
      </div>
    </section>
  )
}

function PageErrorState({
  title = 'Unable to load this section',
  description = 'Something went wrong while fetching data.',
  errorMessage,
  onRetry,
  retryLabel = 'Retry',
}) {
  return (
    <section role="alert" className="status-surface status-surface-error min-w-0 break-words">
      <div className="flex items-start gap-md">
        <AlertTriangleIcon aria-hidden="true" className="mt-1 size-5 shrink-0 text-danger" />
        <div className="min-w-0 space-y-xs">
          <Heading level={2} size="title-sm">
            {title}
          </Heading>
          <Text tone="muted">{description}</Text>
          {errorMessage ? (
            <Text size="body-sm" tone="danger">
              {errorMessage}
            </Text>
          ) : null}
          {onRetry ? (
            <div className="pt-sm">
              <Button size="sm" variant="outline" onClick={onRetry}>
                {retryLabel}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function PageEmptyState({
  title = 'No data available',
  description = 'This section does not have data yet.',
  action,
}) {
  return (
    <section className="status-surface status-surface-info min-w-0 break-words border-dashed bg-panel-muted/50">
      <div className="space-y-xs">
        <Heading level={2} size="title-sm">
          {title}
        </Heading>
        <Text tone="muted">{description}</Text>
        {action ? <div className="pt-sm">{action}</div> : null}
      </div>
    </section>
  )
}

// Native fieldsets disable every control without dropping registered form values.
function PageForm({ disabled, initialValues, className, children, ...props }) {
  const initialized = useRef(false)
  const { methods, persistKey } = props
  useEffect(() => {
    if (initialized.current || !initialValues) return
    initialized.current = true
    if (!readFormDraft(persistKey)) methods.reset(initialValues)
  }, [initialValues, methods, persistKey])
  return (
    <Form {...props} onSubmit={(...args) => (disabled ? undefined : props.onSubmit(...args))}>
      <fieldset disabled={disabled} className={`min-w-0 ${className || ''}`}>
        {children}
      </fieldset>
    </Form>
  )
}

function PageSelectField({ name, label, options }) {
  const id = useId()
  const {
    register,
    formState: { errors },
  } = useFormContext()
  const error = errors[name]?.message
  return (
    <div className="min-w-0 space-y-xs">
      <label htmlFor={id} className="text-body-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={id}
        {...register(name)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-10 min-w-0 w-full rounded-md border border-line bg-panel px-sm text-body-sm text-ink focus-visible:ring-2 focus-visible:ring-primary"
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      {error ? <p id={`${id}-error`} role="alert" className="text-body-sm text-danger">{error}</p> : null}
    </div>
  )
}

export { PageEmptyState, PageErrorState, PageLoadingState, PageForm, PageSelectField }
