import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '../app/QueryProvider/index.js'
import {
  createTripComment,
  createTripInvitation,
  createTripMemberReactivation,
  createTripOwnershipTransfer,
  deleteTripMember,
  listTripComments,
  listTripInvitations,
  listTripMembers,
  updateMyTripCommentEmailPreference,
  updateTripMemberRole,
} from '../services/index.js'
import {
  createMutationConfig,
  invalidateQueryScopes,
  restoreSnapshots,
  snapshotQueries,
} from './hook-utils.js'

const useTripInvitations = ({ tripId, queryOptions = {}, requestOptions = {} } = {}) =>
  useQuery({
    queryKey: queryKeys.collaboration.invitations(tripId || 'unknown'),
    queryFn: () => listTripInvitations(tripId, requestOptions),
    enabled: Boolean(tripId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  })

const useTripMembers = ({ tripId, queryOptions = {}, requestOptions = {} } = {}) =>
  useQuery({
    queryKey: queryKeys.collaboration.members(tripId || 'unknown'),
    queryFn: () => listTripMembers(tripId, requestOptions),
    enabled: Boolean(tripId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  })

const useTripComments = ({
  tripId,
  filters = {},
  queryOptions = {},
  requestOptions = {},
} = {}) =>
  useQuery({
    queryKey: queryKeys.collaboration.comments(tripId || 'unknown', filters),
    queryFn: () => listTripComments(tripId, filters, requestOptions),
    enabled: Boolean(tripId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  })

const useCreateTripInvitation = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, body }) => createTripInvitation(tripId, body, requestOptions),
      mutationOptions,
      onSuccess: async (_data, variables) => {
        await invalidateQueryScopes(queryClient, [
          queryKeys.collaboration.invitations(variables.tripId),
          queryKeys.invitations.mine(),
        ])
      },
    }),
  )
}

const useUpdateTripMemberRole = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, memberId, body }) => updateTripMemberRole(tripId, memberId, body, requestOptions),
      mutationOptions,
      onMutate: async ({ tripId, memberId, body }) => {
        const membersKey = queryKeys.collaboration.members(tripId)
        await queryClient.cancelQueries({ queryKey: membersKey })

        const snapshots = snapshotQueries(queryClient, [membersKey])

        queryClient.setQueryData(membersKey, (current) => {
          if (!current?.members || !Array.isArray(current.members)) {
            return current
          }

          return {
            ...current,
            members: current.members.map((member) =>
              member?._id === memberId
                ? {
                    ...member,
                    ...body,
                  }
                : member,
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
        await invalidateQueryScopes(queryClient, [queryKeys.collaboration.members(variables.tripId)])
      },
    }),
  )
}

const useDeleteTripMember = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, memberId }) => deleteTripMember(tripId, memberId, requestOptions),
      mutationOptions,
      onMutate: async ({ tripId, memberId }) => {
        const membersKey = queryKeys.collaboration.members(tripId)
        await queryClient.cancelQueries({ queryKey: membersKey })

        const snapshots = snapshotQueries(queryClient, [membersKey])

        queryClient.setQueryData(membersKey, (current) => {
          if (!current?.members || !Array.isArray(current.members)) {
            return current
          }

          return {
            ...current,
            members: current.members.map((member) =>
              member?._id === memberId
                ? {
                    ...member,
                    isActive: false,
                  }
                : member,
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
        await invalidateQueryScopes(queryClient, [queryKeys.collaboration.members(variables.tripId)])
      },
    }),
  )
}

const useCreateTripMemberReactivation = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, memberId }) => createTripMemberReactivation(tripId, memberId, requestOptions),
      mutationOptions,
      onMutate: async ({ tripId, memberId }) => {
        const membersKey = queryKeys.collaboration.members(tripId)
        await queryClient.cancelQueries({ queryKey: membersKey })

        const snapshots = snapshotQueries(queryClient, [membersKey])

        queryClient.setQueryData(membersKey, (current) => {
          if (!current?.members || !Array.isArray(current.members)) {
            return current
          }

          return {
            ...current,
            members: current.members.map((member) =>
              member?._id === memberId
                ? {
                    ...member,
                    isActive: true,
                  }
                : member,
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
        await invalidateQueryScopes(queryClient, [queryKeys.collaboration.members(variables.tripId)])
      },
    }),
  )
}

const useCreateTripOwnershipTransfer = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, body }) => createTripOwnershipTransfer(tripId, body, requestOptions),
      mutationOptions,
      onSuccess: async (_data, variables) => {
        await invalidateQueryScopes(queryClient, [
          queryKeys.collaboration.members(variables.tripId),
          queryKeys.trips.detail(variables.tripId),
          queryKeys.trips.root(),
        ])
      },
    }),
  )
}

const useUpdateMyTripCommentEmailPreference = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, body }) => updateMyTripCommentEmailPreference(tripId, body, requestOptions),
      mutationOptions,
      onSuccess: async (_data, variables) => {
        await invalidateQueryScopes(queryClient, [queryKeys.collaboration.members(variables.tripId)])
      },
    }),
  )
}

const useCreateTripComment = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, body }) => createTripComment(tripId, body, requestOptions),
      mutationOptions,
      onSuccess: async (_data, variables) => {
        await invalidateQueryScopes(queryClient, [queryKeys.collaboration.root(variables.tripId)])
      },
    }),
  )
}

export {
  useCreateTripComment,
  useCreateTripInvitation,
  useCreateTripMemberReactivation,
  useCreateTripOwnershipTransfer,
  useUpdateMyTripCommentEmailPreference,
  useDeleteTripMember,
  useTripComments,
  useTripInvitations,
  useTripMembers,
  useUpdateTripMemberRole,
}
