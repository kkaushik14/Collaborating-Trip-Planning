import { cn } from '@/lib/utils'

const textSizeClassMap = {
  body: 'text-body',
  'body-sm': 'text-body-sm',
  caption: 'text-caption',
}

const textToneClassMap = {
  default: 'text-ink',
  muted: 'text-ink-muted',
  inverse: 'text-ink-inverse',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
}

function Text({
  as = 'p',
  size = 'body',
  tone = 'default',
  weight = 'normal',
  className,
  ...props
}) {
  const Component = as
  const weightClass = weight === 'medium' ? 'font-medium' : weight === 'semibold' ? 'font-semibold' : 'font-normal'

  return (
    <Component
      className={cn(
        textSizeClassMap[size] || textSizeClassMap.body,
        textToneClassMap[tone] || textToneClassMap.default,
        weightClass,
        className,
      )}
      {...props}
    />
  )
}

export { Text }
