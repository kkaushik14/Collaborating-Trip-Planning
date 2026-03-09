import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '../app/QueryProvider/index.js'
import {
  createAttachment,
  createAttachmentUpload,
  createChecklist,
  createChecklistItem,
  createExpense,
  createReservation,
  getTripBudgetSummary,
  getTripOrganizationOverview,
  listAttachments,
  listChecklists,
  listExpenses,
  listReservations,
  updateChecklistItem,
  updateTripBudget,
} from '../services/index.js'
import {
  createMutationConfig,
  invalidateQueryScopes,
  restoreSnapshots,
  snapshotQueries,
} from './hook-utils.js'

const useChecklists = ({ tripId, queryOptions = {}, requestOptions = {} } = {}) =>
  useQuery({
    queryKey: queryKeys.organization.checklists(tripId || 'unknown'),
    queryFn: () => listChecklists(tripId, requestOptions),
    enabled: Boolean(tripId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  })

const useAttachments = ({
  tripId,
  filters = {},
  queryOptions = {},
  requestOptions = {},
} = {}) =>
  useQuery({
    queryKey: queryKeys.organization.attachments(tripId || 'unknown', filters),
    queryFn: () => listAttachments(tripId, filters, requestOptions),
    enabled: Boolean(tripId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  })

const useReservations = ({ tripId, queryOptions = {}, requestOptions = {} } = {}) =>
  useQuery({
    queryKey: queryKeys.organization.reservations(tripId || 'unknown'),
    queryFn: () => listReservations(tripId, requestOptions),
    enabled: Boolean(tripId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  })

const useExpenses = ({
  tripId,
  filters = {},
  queryOptions = {},
  requestOptions = {},
} = {}) =>
  useQuery({
    queryKey: queryKeys.organization.expenses(tripId || 'unknown', filters),
    queryFn: () => listExpenses(tripId, filters, requestOptions),
    enabled: Boolean(tripId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  })

const useTripBudgetSummary = ({ tripId, queryOptions = {}, requestOptions = {} } = {}) =>
  useQuery({
    queryKey: queryKeys.organization.budgetSummary(tripId || 'unknown'),
    queryFn: () => getTripBudgetSummary(tripId, requestOptions),
    enabled: Boolean(tripId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  })

const useTripOrganizationOverview = ({ tripId, queryOptions = {}, requestOptions = {} } = {}) =>
  useQuery({
    queryKey: queryKeys.organization.overview(tripId || 'unknown'),
    queryFn: () => getTripOrganizationOverview(tripId, requestOptions),
    enabled: Boolean(tripId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  })

const useCreateChecklist = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, body }) => createChecklist(tripId, body, requestOptions),
      mutationOptions,
      onSuccess: async (_data, variables) => {
        await invalidateQueryScopes(queryClient, [
          queryKeys.organization.checklists(variables.tripId),
          queryKeys.organization.overview(variables.tripId),
        ])
      },
    }),
  )
}

const useCreateChecklistItem = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, checklistId, body }) =>
        createChecklistItem(tripId, checklistId, body, requestOptions),
      mutationOptions,
      onSuccess: async (_data, variables) => {
        await invalidateQueryScopes(queryClient, [
          queryKeys.organization.checklists(variables.tripId),
          queryKeys.organization.overview(variables.tripId),
        ])
      },
    }),
  )
}

const useUpdateChecklistItem = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, checklistId, itemId, body }) =>
        updateChecklistItem(tripId, checklistId, itemId, body, requestOptions),
      mutationOptions,
      onMutate: async ({ tripId, checklistId, itemId, body }) => {
        const checklistKey = queryKeys.organization.checklists(tripId)
        await queryClient.cancelQueries({ queryKey: checklistKey })

        const snapshots = snapshotQueries(queryClient, [checklistKey])

        queryClient.setQueryData(checklistKey, (current) => {
          if (!current?.checklists || !Array.isArray(current.checklists)) {
            return current
          }

          return {
            ...current,
            checklists: current.checklists.map((checklist) => {
              if (checklist?._id !== checklistId || !Array.isArray(checklist.items)) {
                return checklist
              }

              return {
                ...checklist,
                items: checklist.items.map((item) =>
                  item?._id === itemId
                    ? {
                        ...item,
                        ...body,
                      }
                    : item,
                ),
              }
            }),
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
          queryKeys.organization.checklists(variables.tripId),
          queryKeys.organization.overview(variables.tripId),
        ])
      },
    }),
  )
}

const useCreateAttachment = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, body }) => createAttachment(tripId, body, requestOptions),
      mutationOptions,
      onSuccess: async (_data, variables) => {
        await invalidateQueryScopes(queryClient, [
          queryKeys.organization.root(variables.tripId),
        ])
      },
    }),
  )
}

const useCreateAttachmentUpload = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, formData }) => createAttachmentUpload(tripId, formData, requestOptions),
      mutationOptions,
      onSuccess: async (_data, variables) => {
        await invalidateQueryScopes(queryClient, [
          queryKeys.organization.root(variables.tripId),
        ])
      },
    }),
  )
}

const useCreateReservation = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, body }) => createReservation(tripId, body, requestOptions),
      mutationOptions,
      onSuccess: async (_data, variables) => {
        await invalidateQueryScopes(queryClient, [
          queryKeys.organization.reservations(variables.tripId),
          queryKeys.organization.overview(variables.tripId),
        ])
      },
    }),
  )
}

const useCreateExpense = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, body }) => createExpense(tripId, body, requestOptions),
      mutationOptions,
      onSuccess: async (_data, variables) => {
        await invalidateQueryScopes(queryClient, [
          queryKeys.organization.expenses(variables.tripId, {}),
          queryKeys.organization.budgetSummary(variables.tripId),
          queryKeys.organization.overview(variables.tripId),
          queryKeys.analytics.expenseAnalytics(variables.tripId, {}),
          queryKeys.analytics.settlement(variables.tripId),
        ])
      },
    }),
  )
}

const useUpdateTripBudget = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, body }) => updateTripBudget(tripId, body, requestOptions),
      mutationOptions,
      onMutate: async ({ tripId, body }) => {
        const budgetKey = queryKeys.organization.budgetSummary(tripId)
        await queryClient.cancelQueries({ queryKey: budgetKey })

        const snapshots = snapshotQueries(queryClient, [budgetKey])

        queryClient.setQueryData(budgetKey, (current) => {
          if (!current?.budget) {
            return current
          }

          return {
            ...current,
            budget: {
              ...current.budget,
              ...body,
            },
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
          queryKeys.organization.budgetSummary(variables.tripId),
          queryKeys.organization.overview(variables.tripId),
        ])
      },
    }),
  )
}

export {
  useAttachments,
  useChecklists,
  useCreateAttachment,
  useCreateAttachmentUpload,
  useCreateChecklist,
  useCreateChecklistItem,
  useCreateExpense,
  useCreateReservation,
  useExpenses,
  useReservations,
  useTripBudgetSummary,
  useTripOrganizationOverview,
  useUpdateChecklistItem,
  useUpdateTripBudget,
}
