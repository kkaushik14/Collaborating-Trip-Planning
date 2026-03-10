import { CalendarDaysIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

const statusClassMap = {
  completed: 'bg-success',
  active: 'bg-primary',
  upcoming: 'bg-neutral',
}

function Timeline({
  items = [],
  className,
  renderItem,
  emptyLabel = 'No timeline events available.',
}) {
  if (items.length === 0) {
    return (
      <div className={cn('rounded-lg border border-dashed border-line bg-panel-muted p-lg text-body-sm text-ink-muted', className)}>
        {emptyLabel}
      </div>
    )
  }

  return (
    <ol className={cn('space-y-md', className)}>
      {items.map((item, index) => (
        <TimelineItem
          key={item.id || `${item.title}-${index}`}
          item={item}
          isLast={index === items.length - 1}
        >
          {renderItem ? renderItem(item, index) : null}
        </TimelineItem>
      ))}
    </ol>
  )
}

function TimelineItem({
  item,
  isLast = false,
  className,
  children,
}) {
  const status = item?.status || 'upcoming'
  const dotClass = statusClassMap[status] || statusClassMap.upcoming

  return (
    <li className={cn('grid grid-cols-[auto,1fr] gap-md', className)}>
      <div className="flex flex-col items-center">
        <span className={cn('mt-1 size-3 rounded-full', dotClass)} />
        {!isLast ? <span className="mt-xs h-full w-px bg-line" /> : null}
      </div>

      <article className="rounded-lg border border-line bg-panel p-md shadow-card">
        <header className="flex flex-wrap items-center justify-between gap-sm">
          <h3 className="text-title-sm font-semibold text-ink">{item?.title}</h3>

          {item?.timeLabel ? (
            <span className="inline-flex items-center gap-xs rounded-full bg-panel-muted px-sm py-2xs text-caption text-ink-muted">
              <CalendarDaysIcon className="size-3.5" />
              {item.timeLabel}
            </span>
          ) : null}
        </header>

        {item?.subtitle ? (
          <p className="mt-xs text-body-sm text-primary">{item.subtitle}</p>
        ) : null}

        {item?.description ? (
          <p className="mt-xs text-body-sm text-ink-muted">{item.description}</p>
        ) : null}

        {children ? <div className="mt-sm">{children}</div> : null}
      </article>
    </li>
  )
}

export { Timeline, TimelineItem }
