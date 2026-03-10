import { CalendarDaysIcon, PlusIcon, UsersIcon } from 'lucide-react'

import { ActivityCard, SortableActivityList } from '@/components/trip-planning/index.js'
import { Heading, Text } from '@/components/typography/index.js'
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/index.js'
import { cn } from '@/lib/utils'

function formatCurrency(amount, currency) {
  const safeAmount = Number(amount || 0)

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(safeAmount)
  } catch {
    return `${safeAmount} ${currency || 'USD'}`
  }
}

function TripPlanningPanel({
  trip,
  days = [],
  selectedDayId,
  onDayChange,
  onActivitiesReorder,
  onAddActivity,
  canEdit = true,
  className,
}) {
  if (!trip) {
    return null
  }

  const activeDayId = selectedDayId || days[0]?.id || ''

  return (
    <section className={cn('space-y-lg', className)}>
      <header className="flex flex-wrap items-start justify-between gap-md">
        <div className="space-y-xs">
          <Heading level={2}>{trip.title}</Heading>
          <div className="flex flex-wrap items-center gap-sm">
            <span className="inline-flex items-center gap-xs rounded-full bg-panel-muted px-sm py-2xs text-caption text-ink-muted">
              <CalendarDaysIcon className="size-3.5" />
              {trip.dateRangeLabel}
            </span>
            <span className="inline-flex items-center gap-xs rounded-full bg-panel-muted px-sm py-2xs text-caption text-ink-muted">
              <UsersIcon className="size-3.5" />
              {trip.travelerCount} traveler(s)
            </span>
          </div>
        </div>

        <Button
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => onAddActivity?.(activeDayId)}
          disabled={!canEdit}
        >
          <PlusIcon className="size-4" />
          {canEdit ? 'Add Activity' : 'Read-only'}
        </Button>
      </header>

      <Tabs value={activeDayId} onValueChange={onDayChange}>
        <TabsList variant="line" className="w-full overflow-x-auto">
          {days.map((day) => (
            <TabsTrigger key={day.id} value={day.id} className="min-w-max">
              Day {day.dayNumber}
            </TabsTrigger>
          ))}
        </TabsList>

        {days.map((day) => (
          <TabsContent key={day.id} value={day.id} className="space-y-md pt-sm">
            <div className="rounded-lg border border-line bg-panel p-lg shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <div>
                  <Heading level={3} size="title-sm">
                    {day.title}
                  </Heading>
                  <Text size="body-sm" tone="muted">
                    {day.dateLabel}
                  </Text>
                </div>
              </div>

              {day.notes ? (
                <Text size="body-sm" tone="muted" className="mt-sm">
                  {day.notes}
                </Text>
              ) : null}
            </div>

            <SortableActivityList
              activities={day.activities}
              onReorder={(reorderedActivities, context) =>
                onActivitiesReorder?.(day.id, reorderedActivities, context)
              }
              disabled={!canEdit}
              renderActivity={({
                activity,
                index,
                isDragging,
                dragHandleProps,
              }) => (
                <ActivityCard
                  activity={activity}
                  index={index}
                  isDragging={isDragging}
                  dragHandleProps={dragHandleProps}
                  footer={
                    <div className="flex items-center justify-between text-caption text-ink-muted">
                      <span>Estimated Cost</span>
                      <span className="font-medium text-ink">
                        {formatCurrency(activity.estimatedCost, activity.currency)}
                      </span>
                    </div>
                  }
                />
              )}
            />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}

export { TripPlanningPanel }
