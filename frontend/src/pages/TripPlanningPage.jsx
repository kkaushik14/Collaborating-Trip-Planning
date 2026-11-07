import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useOutletContext } from 'react-router-dom'

import { TripPlanningPanel } from '../components/features/index.js'
import { FormMessage, RHFTextField, RHFTextareaField } from '../components/forms/index.js'
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
  PageForm,
} from './PageStates.jsx'
import {
  canEditTripContent,
  formatDateLabel,
  formatCurrency,
  formatTimeLabel,
  getActivityLocationLabel,
  getTripCurrency,
  mapTripSummary,
  normalizeActorRole,
  toDateInputValue,
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

const toIsoStringOrUndefined = (value) => (value ? new Date(value).toISOString() : undefined)

const TripPlanningPage = () => {
  const { tripId, trip } = useOutletContext()
  const itineraryDaysQuery = useItineraryDays({ tripId })
  const createItineraryDayMutation = useCreateItineraryDay()
  const createActivityMutation = useCreateActivityCard()
  const updateActivityOrderMutation = useUpdateActivityOrder()
  const [selectedDayId, setSelectedDayId] = useState('')
  const activitySectionRef = useRef(null)
  const actorRole = normalizeActorRole(trip?.actorRole)
  const canEdit = canEditTripContent(actorRole)
  const currency = getTripCurrency(trip)

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
          estimatedCost: Number(activity.estimatedCost?.amount ?? activity.estimatedCost ?? 0),
          currency: activity.estimatedCost?.currency || currency,
        })),
      }
    })
  }, [itineraryDaysQuery.data?.days, currency])

  const effectiveSelectedDayId = useMemo(() => {
    if (!mappedDays.length) {
      return ''
    }

    const hasSelectedDay = mappedDays.some((day) => day.id === selectedDayId)
    return hasSelectedDay ? selectedDayId : mappedDays[0].id
  }, [mappedDays, selectedDayId])

  const nextDayNumber = Math.max(0, ...mappedDays.map((day) => day.dayNumber)) + 1
  const dateForDay = (dayNumber) => {
    // Trip dates are calendar dates, not local instants.
    const start = trip?.startDate?.slice(0, 10)
    if (!start) return toDateInputValue()
    const date = new Date(`${start}T12:00:00`)
    date.setDate(date.getDate() + dayNumber - 1)
    const value = toDateInputValue(date)
    return trip?.endDate && value > trip.endDate.slice(0, 10) ? '' : value
  }
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
      date: dateForDay(nextDayNumber),
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
      currency,
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
    if (!canEdit || updateActivityOrderMutation.isPending) {
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
    if (!dayId || !canEdit || createActivityMutation.isPending) {
      return
    }

    setSelectedDayId(dayId)
    activityForm.setValue('dayId', dayId, { shouldDirty: true })
    activitySectionRef.current?.querySelector('input[name="title"]')?.focus()
  }

  const handleCreateDay = (values) => {
    if (!canEdit || createItineraryDayMutation.isPending) {
      return
    }

    if ((trip?.startDate && values.date < trip.startDate.slice(0, 10)) ||
        (trip?.endDate && values.date > trip.endDate.slice(0, 10))) {
      itineraryDayForm.setError('date', { message: 'Choose a date within the trip dates.' })
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
          const upcomingDayNumber = Math.max(nextDayNumber, Number(values.dayNumber) + 1)
          itineraryDayForm.reset({
            dayNumber: upcomingDayNumber,
            date: (() => {
              const date = new Date(`${values.date.slice(0, 10)}T12:00:00`)
              date.setDate(date.getDate() + 1)
              const value = toDateInputValue(date)
              return trip?.endDate && value > trip.endDate.slice(0, 10) ? '' : value
            })(),
            title: `Day ${upcomingDayNumber}`,
            notes: '',
          })
        },
      },
    )
  }

  const handleCreateActivityFromForm = (values) => {
    if (!canEdit || createActivityMutation.isPending) {
      return
    }

    const dayId = values.dayId || effectiveSelectedDayId
    if (!mappedDays.some((day) => day.id === dayId)) {
      activityForm.setError('dayId', { message: 'Choose an available itinerary day.' })
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
                  currency: values.currency || currency,
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
            currency: values.currency || currency,
          })
        },
      },
    )
  }

  return (
    <div className="min-w-0 max-w-full space-y-md">
      <section className="grid gap-sm sm:grid-cols-3">
        <article className="min-w-0 break-words rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Days</p>
          <p className="mt-2xs text-title font-semibold text-ink">{planningSummary.totalDays}</p>
        </article>
        <article className="min-w-0 break-words rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Activities</p>
          <p className="mt-2xs text-title font-semibold text-ink">{planningSummary.totalActivities}</p>
        </article>
        <article className="min-w-0 break-words rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Estimated Total</p>
          <p className="mt-2xs text-title font-semibold text-ink">
            {new Set(mappedDays.flatMap((day) => day.activities.map((activity) => activity.currency))).size > 1
              ? 'Multiple currencies'
              : formatCurrency(planningSummary.estimatedCost, mappedDays.flatMap((day) => day.activities)[0]?.currency || currency)}
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
        <article className="min-w-0 break-words rounded-xl border border-line bg-panel p-md shadow-card sm:p-lg">
          <h2 className="text-title-sm font-semibold text-ink">Create Itinerary Day</h2>
          <p className="mt-xs text-body-sm text-ink-muted">
            Add a day to your itinerary, then plan its activities.
          </p>
          <PageForm
            methods={itineraryDayForm}
            initialValues={{ dayNumber: nextDayNumber, date: dateForDay(nextDayNumber), title: `Day ${nextDayNumber}`, notes: '' }}
            disabled={!canEdit || createItineraryDayMutation.isPending}
            onSubmit={handleCreateDay}
            persistKey={`trip:${tripId}:planning:create-day`}
            className="mt-md space-y-sm"
          >
            <RHFTextField name="dayNumber" label="Day Number" type="number" required />
            <RHFTextField name="date" label="Date" type="date" min={trip?.startDate?.slice(0, 10)} max={trip?.endDate?.slice(0, 10)} required />
            <RHFTextField name="title" label="Title" required />
            <RHFTextareaField name="notes" label="Notes" rows={3} />
            {createItineraryDayMutation.error ? (
              <FormMessage>{createItineraryDayMutation.error?.message}</FormMessage>
            ) : null}
            <Button type="submit" disabled={createItineraryDayMutation.isPending || !canEdit}>
              {createItineraryDayMutation.isPending ? 'Creating Day...' : 'Create Day'}
            </Button>
          </PageForm>
        </article>

        <article ref={activitySectionRef} className="min-w-0 break-words rounded-xl border border-line bg-panel p-md shadow-card sm:p-lg">
          <h2 className="text-title-sm font-semibold text-ink">Create Activity Card</h2>
          <p className="mt-xs text-body-sm text-ink-muted">
            Add activity details and place them in the day you choose.
          </p>
          <PageForm
            methods={activityForm}
            disabled={!canEdit || !mappedDays.length || createActivityMutation.isPending}
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
                className="h-10 w-full rounded-md border border-line-strong bg-panel px-lg text-body-sm text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary"
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

            {activityForm.formState.errors.dayId ? <FormMessage>{activityForm.formState.errors.dayId.message}</FormMessage> : null}
            <RHFTextField name="title" label="Title" required />
            <RHFTextareaField name="description" label="Description" rows={2} />
            <RHFTextField name="locationName" label="Location" />
            <div className="grid gap-sm sm:grid-cols-2">
              <RHFTextField name="startTime" label="Start Time" type="datetime-local" />
              <RHFTextField name="endTime" label="End Time" type="datetime-local" />
            </div>
            <div className="grid gap-sm sm:grid-cols-2">
              <RHFTextField name="estimatedCost" label="Estimated Cost" type="number" min="0" step="0.01" />
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
          </PageForm>
        </article>
      </section>

      {!mappedDays.length ? (
        <PageEmptyState
          title="No itinerary days yet"
          description={canEdit ? 'Create your first itinerary day using the form above.' : 'Ask a trip owner or editor to add the first itinerary day.'}
        />
      ) : null}

      {createActivityMutation.error ? (
        <PageErrorState
          title="Unable to create activity"
          description="We could not create this activity right now."
          errorMessage={createActivityMutation.error?.message}
          onRetry={() => createActivityMutation.reset()}
          retryLabel="Dismiss"
        />
      ) : null}

      {createItineraryDayMutation.error ? (
        <PageErrorState
          title="Unable to create itinerary day"
          description="We could not create this day right now."
          errorMessage={createItineraryDayMutation.error?.message}
          onRetry={() => createItineraryDayMutation.reset()}
          retryLabel="Dismiss"
        />
      ) : null}

      {updateActivityOrderMutation.error ? (
        <PageErrorState
          title="Unable to reorder activities"
          description="The latest reorder action could not be saved."
          errorMessage={updateActivityOrderMutation.error?.message}
          onRetry={() => updateActivityOrderMutation.reset()}
          retryLabel="Dismiss"
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
