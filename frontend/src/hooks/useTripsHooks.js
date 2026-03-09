import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '../app/QueryProvider/index.js'
import { createTrip, getTrip, listTrips, replaceTrip, updateTrip } from '../services/index.js'
import { createMutationConfig, invalidateQueryScopes } from './hook-utils.js'

const useTrips = ({ filters = {}, queryOptions = {}, requestOptions = {} } = {}) =>
  useQuery({
    queryKey: queryKeys.trips.list(filters),
    queryFn: () => listTrips({ ...requestOptions, query: filters }),
    ...queryOptions,
  })

const useTrip = ({ tripId, queryOptions = {}, requestOptions = {} } = {}) =>
  useQuery({
    queryKey: queryKeys.trips.detail(tripId || 'unknown'),
    queryFn: () => getTrip(tripId, requestOptions),
    enabled: Boolean(tripId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  })

const applyOptimisticTripPatch = (queryClient, tripId, body) => {
  const detailKey = queryKeys.trips.detail(tripId)
  const previousDetail = queryClient.getQueryData(detailKey)
  const previousLists = queryClient.getQueriesData({ queryKey: queryKeys.trips.root() })

  queryClient.setQueryData(detailKey, (current) => {
    if (!current?.trip) {
      return current
    }

    return {
      ...current,
      trip: {
        ...current.trip,
        ...body,
      },
    }
  })

  queryClient.setQueriesData({ queryKey: queryKeys.trips.root() }, (current) => {
    if (!current?.trips || !Array.isArray(current.trips)) {
      return current
    }

    return {
      ...current,
      trips: current.trips.map((trip) =>
        trip?._id === tripId
          ? {
              ...trip,
              ...body,
            }
          : trip,
      ),
    }
  })

  return {
    detailKey,
    previousDetail,
    previousLists,
  }
}

const rollbackOptimisticTripPatch = (queryClient, context) => {
  if (!context) {
    return
  }

  queryClient.setQueryData(context.detailKey, context.previousDetail)

  for (const [queryKey, data] of context.previousLists || []) {
    queryClient.setQueryData(queryKey, data)
  }
}

const useCreateTrip = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: (body) => createTrip(body, requestOptions),
      mutationOptions,
      onSuccess: async () => {
        await invalidateQueryScopes(queryClient, [queryKeys.trips.root()])
      },
    }),
  )
}

const useUpdateTrip = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, body }) => updateTrip(tripId, body, requestOptions),
      mutationOptions,
      onMutate: async ({ tripId, body }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.trips.detail(tripId) })
        await queryClient.cancelQueries({ queryKey: queryKeys.trips.root() })
        return applyOptimisticTripPatch(queryClient, tripId, body)
      },
      onError: async (_error, _variables, context) => {
        rollbackOptimisticTripPatch(queryClient, context)
      },
      onSuccess: async (data, variables) => {
        const tripId = variables.tripId
        queryClient.setQueryData(queryKeys.trips.detail(tripId), (current) => ({
          ...current,
          ...data,
        }))
      },
      onSettled: async (_data, _error, variables) => {
        await invalidateQueryScopes(queryClient, [
          queryKeys.trips.detail(variables.tripId),
          queryKeys.trips.root(),
        ])
      },
    }),
  )
}

const useReplaceTrip = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, body }) => replaceTrip(tripId, body, requestOptions),
      mutationOptions,
      onMutate: async ({ tripId, body }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.trips.detail(tripId) })
        await queryClient.cancelQueries({ queryKey: queryKeys.trips.root() })
        return applyOptimisticTripPatch(queryClient, tripId, body)
      },
      onError: async (_error, _variables, context) => {
        rollbackOptimisticTripPatch(queryClient, context)
      },
      onSuccess: async (data, variables) => {
        queryClient.setQueryData(queryKeys.trips.detail(variables.tripId), (current) => ({
          ...current,
          ...data,
        }))
      },
      onSettled: async (_data, _error, variables) => {
        await invalidateQueryScopes(queryClient, [
          queryKeys.trips.detail(variables.tripId),
          queryKeys.trips.root(),
        ])
      },
    }),
  )
}

export {
  useCreateTrip,
  useReplaceTrip,
  useTrip,
  useTrips,
  useUpdateTrip,
}
