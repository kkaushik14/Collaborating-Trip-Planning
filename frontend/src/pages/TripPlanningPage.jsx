import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useOutletContext } from 'react-router-dom'

import { TripPlanningPanel } from '../components/features/index.js'
import { Form, FormMessage, RHFTextField, RHFTextareaField } from '../components/forms/index.js'
import {
  useCreateActivityCard,
  useCreateItineraryDay,
  useItineraryDays,
  useUpdateActivityOrder,
} from '../hooks/index.js'
import { Button } from '../components/ui/index.js'
import { activityCardSchema, itineraryDaySchema } from '../validators/index.js'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from './PageStates.jsx'
import {
  canEditTripContent,
  formatDateLabel,
  formatCurrency,
  formatTimeLabel,
  getActivityLocationLabel,
  mapTripSummary,
  normalizeActorRole,
} from './tripPageUtils.js'

const orderActivitiesByList = (activities = [], orderedIds = []) => {
  if (!Array.isArray(orderedIds) || !orderedIds.length) {
    return activities
  }

  const activityMap = new Map(activities.map((activity) => [activity?._id, activity]))
  const ordered = orderedIds
    .map((id) => activityMap.get(id))
    .filter(Boolean)

  if (!ordered.length) {
    return activities
  }

  const missing = activities.filter((activity) => !orderedIds.includes(activity?._id))
  return [...ordered, ...missing]
}

const toDateInputValue = (value = new Date()) => value.toISOString().slice(0, 10)
const toIsoStringOrUndefined = (value) => (value ? new Date(value).toISOString() : undefined)

const TripPlanningPage = () => {
  const { tripId, trip } = useOutletContext()
  const itineraryDaysQuery = useItineraryDays({ tripId })
  const createItineraryDayMutation = useCreateItineraryDay()
  const createActivityMutation = useCreateActivityCard()
  const updateActivityOrderMutation = useUpdateActivityOrder()
  const [selectedDayId, setSelectedDayId] = useState('')
  const actorRole = normalizeActorRole(trip?.actorRole)
  const canEdit = canEditTripContent(actorRole)

  const mappedDays = useMemo(() => {
    const days = itineraryDaysQuery.data?.days || []

    return days.map((day) => {
      const orderedActivities = orderActivitiesByList(day.activities || [], day.activityOrder || [])

      return {
        id: day._id,
        dayNumber: Number(day.dayNumber || 0),
        title: day.title || `Day ${day.dayNumber || '-'}`,
        dateLabel: formatDateLabel(day.date),
        notes: day.notes || '',
        activities: orderedActivities.map((activity) => ({
          id: activity._id,
          title: activity.title || 'Untitled Activity',
          description: activity.description || '',
          startTime: formatTimeLabel(activity.startTime),
          endTime: formatTimeLabel(activity.endTime),
          location: getActivityLocationLabel(activity),
          category: activity.category || activity.reservationType || 'general',
          estimatedCost: Number(activity.estimatedCost?.amount || activity.estimatedCost || 0),
          currency: activity.estimatedCost?.currency || 'USD',
        })),
      }
    })
  }, [itineraryDaysQuery.data?.days])

  const effectiveSelectedDayId = useMemo(() => {
    if (!mappedDays.length) {
      return ''
    }

    const hasSelectedDay = mappedDays.some((day) => day.id === selectedDayId)
    return hasSelectedDay ? selectedDayId : mappedDays[0].id
  }, [mappedDays, selectedDayId])

  const nextDayNumber = mappedDays.length + 1
  const planningSummary = useMemo(() => {
    const totalActivities = mappedDays.reduce(
      (count, day) => count + (Array.isArray(day.activities) ? day.activities.length : 0),
      0,
    )
    const estimatedCost = mappedDays.reduce(
      (sum, day) =>
        sum +
        (day.activities || []).reduce(
          (activitySum, activity) => activitySum + Number(activity.estimatedCost || 0),
          0,
        ),
      0,
    )

    return {
      totalDays: mappedDays.length,
      totalActivities,
      estimatedCost,
    }
  }, [mappedDays])

  const itineraryDayForm = useForm({
    resolver: zodResolver(itineraryDaySchema),
    defaultValues: {
      dayNumber: nextDayNumber,
      date: toDateInputValue(),
      title: `Day ${nextDayNumber}`,
      notes: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  const activityForm = useForm({
    resolver: zodResolver(activityCardSchema),
    defaultValues: {
      dayId: '',
      title: '',
      description: '',
      locationName: '',
      startTime: '',
      endTime: '',
      estimatedCost: 0,
      currency: 'USD',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })
  const watchedActivityDayId = useWatch({
    control: activityForm.control,
    name: 'dayId',
  })

  if (itineraryDaysQuery.isPending) {
    return (
      <PageLoadingState
        title="Loading itinerary..."
        description="Fetching itinerary days and activities for this trip."
      />
    )
  }

  if (itineraryDaysQuery.error) {
    return (
      <PageErrorState
        title="Unable to load itinerary"
        description="Trip planning data could not be fetched."
        errorMessage={itineraryDaysQuery.error?.message}
        onRetry={() => itineraryDaysQuery.refetch()}
      />
    )
  }

  const handleActivitiesReorder = (dayId, reorderedActivities) => {
    if (!canEdit) {
      return
    }

    const orderedIds = reorderedActivities.map((activity) => activity.id).filter(Boolean)
    if (!orderedIds.length) {
      return
    }

    updateActivityOrderMutation.mutate({
      tripId,
      dayId,
      body: {
        activityIds: orderedIds,
      },
    })
  }

  const handleAddActivity = (dayId) => {
    if (!dayId || !canEdit) {
      return
    }

    const day = mappedDays.find((item) => item.id === dayId)
    const position = day?.activities?.length || 0

    createActivityMutation.mutate({
      tripId,
      dayId,
      body: {
        title: `New Activity ${position + 1}`,
        description: 'Draft activity created from planning page.',
        position,
      },
    })
  }

  const handleCreateDay = (values) => {
    if (!canEdit) {
      return
    }

    createItineraryDayMutation.mutate(
      {
        tripId,
        body: {
          ...values,
          date: new Date(values.date).toISOString(),
        },
      },
      {
        onSuccess: () => {
          const upcomingDayNumber = nextDayNumber + 1
          itineraryDayForm.reset({
            dayNumber: upcomingDayNumber,
            date: toDateInputValue(),
            title: `Day ${upcomingDayNumber}`,
            notes: '',
          })
        },
      },
    )
  }

  const handleCreateActivityFromForm = (values) => {
    if (!canEdit) {
      return
    }

    const dayId = values.dayId || effectiveSelectedDayId
    if (!dayId) {
      return
    }

    createActivityMutation.mutate(
      {
        tripId,
        dayId,
        body: {
          title: values.title,
          description: values.description || '',
          locationName: values.locationName || '',
          startTime: toIsoStringOrUndefined(values.startTime),
          endTime: toIsoStringOrUndefined(values.endTime),
          estimatedCost:
            values.estimatedCost !== undefined && values.estimatedCost !== ''
              ? {
                  amount: Number(values.estimatedCost || 0),
                  currency: values.currency || 'USD',
                }
              : undefined,
        },
      },
      {
        onSuccess: () => {
          activityForm.reset({
            dayId,
            title: '',
            description: '',
            locationName: '',
            startTime: '',
            endTime: '',
            estimatedCost: 0,
            currency: 'USD',
          })
        },
      },
    )
  }

  return (
    <div className="space-y-md">
      <section className="grid gap-sm sm:grid-cols-3">
        <article className="rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Days</p>
          <p className="mt-2xs text-title font-semibold text-ink">{planningSummary.totalDays}</p>
        </article>
        <article className="rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Activities</p>
          <p className="mt-2xs text-title font-semibold text-ink">{planningSummary.totalActivities}</p>
        </article>
        <article className="rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Estimated Total</p>
          <p className="mt-2xs text-title font-semibold text-ink">
            {formatCurrency(planningSummary.estimatedCost, trip?.currency || 'USD')}
          </p>
        </article>
      </section>

      {!canEdit ? (
        <PageEmptyState
          title="Read-only Planning Access"
          description={`Your current role is ${actorRole}. Owners and editors can create and reorder itinerary details.`}
        />
      ) : null}

      <section className="grid gap-md lg:grid-cols-2">
        <article className="rounded-xl border border-line bg-panel p-lg shadow-card">
          <h3 className="text-title-sm font-semibold text-ink">Create Itinerary Day</h3>
          <p className="mt-xs text-body-sm text-ink-muted">
            Add day metadata before adding activity cards.
          </p>
          <Form
            methods={itineraryDayForm}
            onSubmit={handleCreateDay}
            persistKey={`trip:${tripId}:planning:create-day`}
            className="mt-md space-y-sm"
          >
            <RHFTextField name="dayNumber" label="Day Number" type="number" required />
            <RHFTextField name="date" label="Date" type="date" required />
            <RHFTextField name="title" label="Title" required />
            <RHFTextareaField name="notes" label="Notes" rows={3} />
            {createItineraryDayMutation.error ? (
              <FormMessage>{createItineraryDayMutation.error?.message}</FormMessage>
            ) : null}
            <Button type="submit" disabled={createItineraryDayMutation.isPending || !canEdit}>
              {createItineraryDayMutation.isPending ? 'Creating Day...' : 'Create Day'}
            </Button>
          </Form>
        </article>

        <article className="rounded-xl border border-line bg-panel p-lg shadow-card">
          <h3 className="text-title-sm font-semibold text-ink">Create Activity Card</h3>
          <p className="mt-xs text-body-sm text-ink-muted">
            Add activity details and place them in the day you choose.
          </p>
          <Form
            methods={activityForm}
            onSubmit={handleCreateActivityFromForm}
            persistKey={`trip:${tripId}:planning:create-activity`}
            className="mt-md space-y-sm"
          >
            <div className="space-y-xs">
              <label htmlFor="activity-day-id" className="text-body-sm font-medium text-ink">
                Day
              </label>
              <select
                id="activity-day-id"
                className="h-10 w-full rounded-md border border-line bg-panel px-lg text-body-sm text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                value={watchedActivityDayId || effectiveSelectedDayId || ''}
                disabled={!canEdit || !mappedDays.length}
                onChange={(event) =>
                  activityForm.setValue('dayId', event.target.value, {
                    shouldDirty: true,
                    shouldTouch: true,
                  })
                }
              >
                <option value="">Use selected day</option>
                {mappedDays.map((day) => (
                  <option key={day.id} value={day.id}>
                    Day {day.dayNumber} - {day.title}
                  </option>
                ))}
              </select>
            </div>

            <RHFTextField name="title" label="Title" required />
            <RHFTextareaField name="description" label="Description" rows={2} />
            <RHFTextField name="locationName" label="Location" />
            <div className="grid gap-sm sm:grid-cols-2">
              <RHFTextField name="startTime" label="Start Time" type="datetime-local" />
              <RHFTextField name="endTime" label="End Time" type="datetime-local" />
            </div>
            <div className="grid gap-sm sm:grid-cols-2">
              <RHFTextField name="estimatedCost" label="Estimated Cost" type="number" />
              <RHFTextField name="currency" label="Currency" />
            </div>
            {createActivityMutation.error ? (
              <FormMessage>{createActivityMutation.error?.message}</FormMessage>
            ) : null}
            {!mappedDays.length ? (
              <FormMessage>Create at least one itinerary day before adding activities.</FormMessage>
            ) : null}
            <Button type="submit" disabled={createActivityMutation.isPending || !canEdit || !mappedDays.length}>
              {createActivityMutation.isPending ? 'Creating Activity...' : 'Create Activity'}
            </Button>
          </Form>
        </article>
      </section>

      {!mappedDays.length ? (
        <PageEmptyState
          title="No itinerary days yet"
          description="Create your first itinerary day using the form above."
        />
      ) : null}

      {createActivityMutation.error ? (
        <PageErrorState
          title="Unable to create activity"
          description="We could not create this activity right now."
          errorMessage={createActivityMutation.error?.message}
          onRetry={() => createActivityMutation.reset()}
        />
      ) : null}

      {createItineraryDayMutation.error ? (
        <PageErrorState
          title="Unable to create itinerary day"
          description="We could not create this day right now."
          errorMessage={createItineraryDayMutation.error?.message}
          onRetry={() => createItineraryDayMutation.reset()}
        />
      ) : null}

      {updateActivityOrderMutation.error ? (
        <PageErrorState
          title="Unable to reorder activities"
          description="The latest reorder action could not be saved."
          errorMessage={updateActivityOrderMutation.error?.message}
          onRetry={() => updateActivityOrderMutation.reset()}
        />
      ) : null}

      <TripPlanningPanel
        trip={mapTripSummary(trip)}
        days={mappedDays}
        selectedDayId={effectiveSelectedDayId}
        onDayChange={setSelectedDayId}
        onActivitiesReorder={canEdit ? handleActivitiesReorder : undefined}
        onAddActivity={canEdit ? handleAddActivity : undefined}
        canEdit={canEdit}
      />
    </div>
  )
}

export default TripPlanningPage
