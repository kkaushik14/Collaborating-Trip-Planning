import { cn } from '@/lib/utils'

function FormFieldLayout({ className, ...props }) {
  return <div className={cn('space-y-xs', className)} {...props} />
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
        <span className="ml-2xs text-danger" aria-hidden="true">
          *
        </span>
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
