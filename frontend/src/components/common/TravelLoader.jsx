import { BikeIcon, PlaneTakeoffIcon, TrainFrontIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function TravelLoader({
  title = 'Loading your trip experience...',
  description = 'Please wait while we prepare this section.',
  className,
}) {
  return (
    <div className={cn('space-y-sm text-center', className)}>
      <div className="mx-auto flex w-fit items-end gap-sm rounded-full border border-line bg-panel-muted px-md py-sm">
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary/12 text-primary animate-bounce [animation-delay:0ms]">
          <PlaneTakeoffIcon className="size-4" />
        </span>
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary/12 text-primary animate-bounce [animation-delay:140ms]">
          <TrainFrontIcon className="size-4" />
        </span>
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary/12 text-primary animate-bounce [animation-delay:280ms]">
          <BikeIcon className="size-4" />
        </span>
      </div>
      <p className="text-title-sm font-semibold text-ink">{title}</p>
      <p className="mx-auto max-w-[42ch] text-body-sm text-ink-muted">{description}</p>
    </div>
  )
}

export default TravelLoader
