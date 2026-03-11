import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '../app/QueryProvider/index.js'
import {
  createUserAccount,
  createUserSession,
  deleteUserSession,
  getUserProfile,
  updateUserProfile,
  updateUserSession,
} from '../services/index.js'
import { createMutationConfig, invalidateQueryScopes } from './hook-utils.js'

const useUserProfile = ({ queryOptions = {}, requestOptions = {} } = {}) =>
  useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => getUserProfile(requestOptions),
    ...queryOptions,
  })

const useCreateUserAccount = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: (body) => createUserAccount(body, requestOptions),
      mutationOptions,
      onSuccess: async () => {
        await invalidateQueryScopes(queryClient, [queryKeys.auth.me()])
      },
    }),
  )
}

const useCreateUserSession = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: (body) => createUserSession(body, requestOptions),
      mutationOptions,
      onSuccess: async () => {
        await invalidateQueryScopes(queryClient, [queryKeys.auth.me()])
      },
    }),
  )
}

const useUpdateUserSession = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: (body) => updateUserSession(body, requestOptions),
      mutationOptions,
      onSuccess: async () => {
        await invalidateQueryScopes(queryClient, [queryKeys.auth.me()])
      },
    }),
  )
}

const useUpdateUserProfile = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: (body) => updateUserProfile(body, requestOptions),
      mutationOptions,
      onSuccess: async () => {
        await invalidateQueryScopes(queryClient, [queryKeys.auth.me()])
      },
    }),
  )
}

const useDeleteUserSession = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: () => deleteUserSession(requestOptions),
      mutationOptions,
      onSuccess: async () => {
        await queryClient.cancelQueries()
        queryClient.removeQueries({ queryKey: queryKeys.auth.root(), exact: false })
        queryClient.removeQueries({ queryKey: queryKeys.invitations.root(), exact: false })
        queryClient.removeQueries({ queryKey: queryKeys.trips.root(), exact: false })
        queryClient.removeQueries({ queryKey: ['itinerary'], exact: false })
        queryClient.removeQueries({ queryKey: ['collaboration'], exact: false })
        queryClient.removeQueries({ queryKey: ['organization'], exact: false })
        queryClient.removeQueries({ queryKey: ['analytics'], exact: false })
      },
    }),
  )
}

export {
  useCreateUserAccount,
  useCreateUserSession,
  useDeleteUserSession,
  useUpdateUserProfile,
  useUpdateUserSession,
  useUserProfile,
}
