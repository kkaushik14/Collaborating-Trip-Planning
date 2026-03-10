import { Clock3Icon, GripVerticalIcon, MapPinIcon, TagIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function ActivityCard({
  activity,
  index,
  className,
  isDragging = false,
  dragHandleProps,
  dragDisabled = false,
  onClick,
  footer,
}) {
  const title = activity?.title || `Activity ${index + 1}`
  const description = activity?.description
  const startTime = activity?.startTime
  const endTime = activity?.endTime
  const location = activity?.location
  const category = activity?.category

  const timeLabel =
    startTime && endTime
      ? `${startTime} - ${endTime}`
      : startTime || endTime || null

  return (
    <article
      data-dragging={isDragging}
      className={cn(
        'rounded-lg border border-line bg-panel p-lg shadow-card transition-shadow data-[dragging=true]:shadow-lg',
        onClick ? 'cursor-pointer hover:shadow-lg' : '',
        className,
      )}
      onClick={onClick}
    >
      <header className="flex items-start gap-md">
        <button
          type="button"
          className={cn(
            'mt-2 inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-line bg-panel-muted text-ink-muted outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/30',
            dragDisabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-line/30',
          )}
          aria-label={dragDisabled ? `${title} drag disabled` : `Reorder ${title}`}
          onClick={(event) => event.stopPropagation()}
          disabled={dragDisabled}
          {...dragHandleProps}
        >
          <GripVerticalIcon className="size-4" />
        </button>

        <div className="min-w-0 flex-1">
          <h3 className="text-title-sm font-semibold text-ink">{title}</h3>
          {description ? (
            <p className="mt-xs text-body-sm text-ink-muted">{description}</p>
          ) : null}
        </div>
      </header>

      <div className="mt-md flex flex-wrap items-center gap-sm">
        {timeLabel ? (
          <span className="inline-flex items-center gap-xs rounded-full bg-panel-muted px-sm py-2xs text-caption text-ink-muted">
            <Clock3Icon className="size-3.5" />
            {timeLabel}
          </span>
        ) : null}

        {location ? (
          <span className="inline-flex items-center gap-xs rounded-full bg-panel-muted px-sm py-2xs text-caption text-ink-muted">
            <MapPinIcon className="size-3.5" />
            {location}
          </span>
        ) : null}

        {category ? (
          <span className="inline-flex items-center gap-xs rounded-full bg-primary/10 px-sm py-2xs text-caption text-primary">
            <TagIcon className="size-3.5" />
            {category}
          </span>
        ) : null}
      </div>

      {footer ? <div className="mt-md border-t border-line pt-md">{footer}</div> : null}
    </article>
  )
}

export { ActivityCard }
