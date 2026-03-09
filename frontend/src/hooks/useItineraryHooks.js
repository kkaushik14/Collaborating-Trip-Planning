import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '../app/QueryProvider/index.js'
import {
  createActivityCard,
  createItineraryDay,
  listActivitiesForDay,
  listItineraryDays,
  updateActivityOrder,
} from '../services/index.js'
import {
  createMutationConfig,
  invalidateQueryScopes,
  restoreSnapshots,
  snapshotQueries,
} from './hook-utils.js'

const useItineraryDays = ({ tripId, queryOptions = {}, requestOptions = {} } = {}) =>
  useQuery({
    queryKey: queryKeys.itinerary.days(tripId || 'unknown'),
    queryFn: () => listItineraryDays(tripId, requestOptions),
    enabled: Boolean(tripId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  })

const useActivitiesForDay = ({ tripId, dayId, queryOptions = {}, requestOptions = {} } = {}) =>
  useQuery({
    queryKey: queryKeys.itinerary.activities(tripId || 'unknown', dayId || 'unknown'),
    queryFn: () => listActivitiesForDay(tripId, dayId, requestOptions),
    enabled: Boolean(tripId && dayId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  })

const useCreateItineraryDay = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, body }) => createItineraryDay(tripId, body, requestOptions),
      mutationOptions,
      onSuccess: async (_data, variables) => {
        await invalidateQueryScopes(queryClient, [
          queryKeys.itinerary.days(variables.tripId),
          queryKeys.trips.detail(variables.tripId),
        ])
      },
    }),
  )
}

const useCreateActivityCard = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, dayId, body }) => createActivityCard(tripId, dayId, body, requestOptions),
      mutationOptions,
      onSuccess: async (_data, variables) => {
        await invalidateQueryScopes(queryClient, [
          queryKeys.itinerary.activities(variables.tripId, variables.dayId),
          queryKeys.itinerary.days(variables.tripId),
        ])
      },
    }),
  )
}

const useUpdateActivityOrder = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, dayId, body }) => updateActivityOrder(tripId, dayId, body, requestOptions),
      mutationOptions,
      onMutate: async ({ tripId, dayId, body }) => {
        const activitiesKey = queryKeys.itinerary.activities(tripId, dayId)
        const daysKey = queryKeys.itinerary.days(tripId)

        await queryClient.cancelQueries({ queryKey: activitiesKey })
        await queryClient.cancelQueries({ queryKey: daysKey })

        const snapshots = snapshotQueries(queryClient, [activitiesKey, daysKey])
        const orderedIds = Array.isArray(body?.activityIds) ? body.activityIds : []

        queryClient.setQueryData(activitiesKey, (current) => {
          if (!current?.activities || !Array.isArray(current.activities) || !orderedIds.length) {
            return current
          }

          const activityMap = new Map(current.activities.map((activity) => [activity?._id, activity]))
          const reordered = orderedIds
            .map((activityId, index) => {
              const activity = activityMap.get(activityId)
              if (!activity) {
                return null
              }

              return {
                ...activity,
                position: index,
              }
            })
            .filter(Boolean)

          return {
            ...current,
            activities: reordered.length ? reordered : current.activities,
            day: current.day
              ? {
                  ...current.day,
                  activityOrder: orderedIds,
                }
              : current.day,
          }
        })

        queryClient.setQueryData(daysKey, (current) => {
          if (!current?.days || !Array.isArray(current.days) || !orderedIds.length) {
            return current
          }

          return {
            ...current,
            days: current.days.map((day) =>
              day?._id === dayId
                ? {
                    ...day,
                    activityOrder: orderedIds,
                  }
                : day,
            ),
          }
        })

        return {
          snapshots,
        }
      },
      onError: async (_error, _variables, context) => {
        restoreSnapshots(queryClient, context?.snapshots || [])
      },
      onSettled: async (_data, _error, variables) => {
        await invalidateQueryScopes(queryClient, [
          queryKeys.itinerary.activities(variables.tripId, variables.dayId),
          queryKeys.itinerary.days(variables.tripId),
        ])
      },
    }),
  )
}

export {
  useActivitiesForDay,
  useCreateActivityCard,
  useCreateItineraryDay,
  useItineraryDays,
  useUpdateActivityOrder,
}
