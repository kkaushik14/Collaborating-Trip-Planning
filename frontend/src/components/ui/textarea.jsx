import { cn } from '@/lib/utils'

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'min-h-24 w-full rounded-md border border-line bg-panel px-lg py-md text-body-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:bg-panel-muted disabled:text-ink-muted aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger/20',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
