import { cn } from '@/lib/utils'

const toneClassMap = {
  primary: 'bg-primary',
  neutral: 'bg-neutral',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

function formatCurrency(value, currency) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${value.toFixed(2)} ${currency}`
  }
}

function SegmentedBudgetProgress({
  segments = [],
  total,
  currency = 'USD',
  className,
  showLegend = true,
}) {
  const normalizedSegments = segments
    .map((segment) => ({
      ...segment,
      value: Number(segment?.value || 0),
    }))
    .filter((segment) => segment.value > 0)

  const computedTotal = Number(total || 0) || normalizedSegments.reduce((sum, segment) => sum + segment.value, 0)

  if (normalizedSegments.length === 0 || computedTotal <= 0) {
    return (
      <div className={cn('rounded-lg border border-dashed border-line bg-panel-muted p-lg text-body-sm text-ink-muted', className)}>
        No budget segments available.
      </div>
    )
  }

  return (
    <section className={cn('space-y-md rounded-lg border border-line bg-panel p-lg shadow-card', className)}>
      <div className="h-3 w-full overflow-hidden rounded-full bg-panel-muted">
        <div className="flex h-full w-full">
          {normalizedSegments.map((segment, index) => {
            const widthPercent = (segment.value / computedTotal) * 100
            const toneClass = toneClassMap[segment.tone] || 'bg-primary'

            return (
              <div
                key={segment.id || `${segment.label}-${index}`}
                className={cn('h-full', toneClass)}
                style={{ width: `${Math.max(widthPercent, 2)}%` }}
                aria-label={`${segment.label}: ${widthPercent.toFixed(1)}%`}
                title={`${segment.label}: ${widthPercent.toFixed(1)}%`}
              />
            )
          })}
        </div>
      </div>

      {showLegend ? (
        <ul className="grid gap-sm sm:grid-cols-2">
          {normalizedSegments.map((segment, index) => {
            const toneClass = toneClassMap[segment.tone] || 'bg-primary'
            const widthPercent = (segment.value / computedTotal) * 100

            return (
              <li
                key={segment.id || `${segment.label}-legend-${index}`}
                className="flex items-center justify-between rounded-md border border-line bg-panel-muted px-md py-sm"
              >
                <span className="inline-flex items-center gap-sm text-body-sm text-ink">
                  <span className={cn('size-2.5 rounded-full', toneClass)} />
                  {segment.label}
                </span>
                <span className="text-caption text-ink-muted">
                  {formatCurrency(segment.value, currency)} ({widthPercent.toFixed(1)}%)
                </span>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}

export { SegmentedBudgetProgress }
