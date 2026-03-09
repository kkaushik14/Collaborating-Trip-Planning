import { Input as InputPrimitive } from '@base-ui/react/input'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 rounded-md border border-line bg-panel px-lg text-body-sm text-ink placeholder:text-ink-muted outline-none transition-colors file:border-0 file:bg-transparent file:text-body-sm file:font-medium file:text-ink focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:bg-panel-muted disabled:text-ink-muted aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger/20',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
