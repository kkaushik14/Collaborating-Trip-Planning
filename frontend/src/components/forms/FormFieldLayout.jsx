import { cn } from '@/lib/utils'

function FormFieldLayout({ className, ...props }) {
  return <div className={cn('min-w-0 space-y-xs [overflow-wrap:anywhere]', className)} {...props} />
}

function FormLabel({
  className,
  required = false,
  children,
  ...props
}) {
  return (
    <label
      className={cn('text-body-sm font-medium text-ink', className)}
      {...props}
    >
      {children}
      {required ? (
        <span className="ml-2xs text-danger after:content-['*']" aria-hidden="true" />
      ) : null}
    </label>
  )
}

function FormDescription({ className, ...props }) {
  return (
    <p className={cn('text-caption text-ink-muted', className)} {...props} />
  )
}

function FormMessage({ className, ...props }) {
  return (
    <p
      className={cn('text-caption font-medium text-danger', className)}
      role="alert"
      {...props}
    />
  )
}

export {
  FormDescription,
  FormFieldLayout,
  FormLabel,
  FormMessage,
}
