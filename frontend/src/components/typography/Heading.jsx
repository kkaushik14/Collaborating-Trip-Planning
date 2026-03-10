import { cn } from '@/lib/utils'

const headingSizeClassMap = {
  display: 'text-display leading-tight font-semibold tracking-tight',
  title: 'text-title font-semibold',
  'title-sm': 'text-title-sm font-semibold',
}

const headingToneClassMap = {
  default: 'text-ink',
  muted: 'text-ink-muted',
  inverse: 'text-ink-inverse',
  primary: 'text-primary',
  danger: 'text-danger',
}

function resolveHeadingSize(level, explicitSize) {
  if (explicitSize) {
    return explicitSize
  }

  if (level <= 1) {
    return 'display'
  }

  if (level === 2) {
    return 'title'
  }

  return 'title-sm'
}

function Heading({
  as,
  level = 2,
  size,
  tone = 'default',
  className,
  ...props
}) {
  const safeLevel = Math.min(6, Math.max(1, Number(level) || 2))
  const Tag = as || `h${safeLevel}`
  const resolvedSize = resolveHeadingSize(safeLevel, size)

  return (
    <Tag
      className={cn(
        headingSizeClassMap[resolvedSize],
        headingToneClassMap[tone] || headingToneClassMap.default,
        className,
      )}
      {...props}
    />
  )
}

export { Heading }
