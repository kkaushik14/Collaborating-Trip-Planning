import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-sm rounded-md border border-transparent text-body-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4',
  {
    variants: {
      variant: {
        default: 'bg-primary text-ink-inverse hover:bg-primary-strong',
        outline: 'border-line bg-panel text-ink hover:bg-panel-muted',
        secondary: 'bg-panel-muted text-ink hover:bg-line/30',
        ghost: 'text-ink hover:bg-panel-muted',
        destructive: 'bg-danger text-ink-inverse hover:bg-danger/90',
        link: 'h-auto border-0 px-0 text-warning underline-offset-4 hover:text-warning/80 hover:underline',
      },
      size: {
        default: 'h-10 px-lg',
        sm: 'h-9 px-md',
        lg: 'h-11 px-xl',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }
