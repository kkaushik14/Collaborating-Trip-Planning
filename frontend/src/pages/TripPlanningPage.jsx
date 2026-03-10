import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import { TripPlanningPanel } from '../components/features/index.js'
import {
  useCreateActivityCard,
  useItineraryDays,
  useUpdateActivityOrder,
} from '../hooks/index.js'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from './PageStates.jsx'
import {
  formatDateLabel,
  formatTimeLabel,
  getActivityLocationLabel,
  mapTripSummary,
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

const TripPlanningPage = () => {
  const { tripId, trip } = useOutletContext()
  const itineraryDaysQuery = useItineraryDays({ tripId })
  const createActivityMutation = useCreateActivityCard()
  const updateActivityOrderMutation = useUpdateActivityOrder()
  const [selectedDayId, setSelectedDayId] = useState('')

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

  if (!mappedDays.length) {
    return (
      <PageEmptyState
        title="No itinerary days yet"
        description="Create a day in backend and refresh. This page will render it automatically."
      />
    )
  }

  const handleActivitiesReorder = (dayId, reorderedActivities) => {
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
    if (!dayId) {
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

  return (
    <div className="space-y-md">
      {createActivityMutation.error ? (
        <PageErrorState
          title="Unable to create activity"
          description="The API rejected the activity creation request."
          errorMessage={createActivityMutation.error?.message}
          onRetry={() => createActivityMutation.reset()}
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
        onActivitiesReorder={handleActivitiesReorder}
        onAddActivity={handleAddActivity}
      />
    </div>
  )
}

export default TripPlanningPage
