import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '../app/QueryProvider/index.js'
import {
  createCurrencyConversion,
  createReportSnapshot,
  getExpenseAnalytics,
  getReportSnapshot,
  getReportSnapshotDownload,
  getSettlementReport,
  listReportSnapshots,
  listTripExchangeRates,
  updateTripExchangeRate,
} from '../services/index.js'
import { createMutationConfig, invalidateQueryScopes } from './hook-utils.js'

const useTripExchangeRates = ({ tripId, queryOptions = {}, requestOptions = {} } = {}) =>
  useQuery({
    queryKey: queryKeys.analytics.exchangeRates(tripId || 'unknown'),
    queryFn: () => listTripExchangeRates(tripId, requestOptions),
    enabled: Boolean(tripId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  })

const useExpenseAnalytics = ({
  tripId,
  filters = {},
  queryOptions = {},
  requestOptions = {},
} = {}) =>
  useQuery({
    queryKey: queryKeys.analytics.expenseAnalytics(tripId || 'unknown', filters),
    queryFn: () => getExpenseAnalytics(tripId, filters, requestOptions),
    enabled: Boolean(tripId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  })

const useSettlementReport = ({ tripId, queryOptions = {}, requestOptions = {} } = {}) =>
  useQuery({
    queryKey: queryKeys.analytics.settlement(tripId || 'unknown'),
    queryFn: () => getSettlementReport(tripId, requestOptions),
    enabled: Boolean(tripId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  })

const useReportSnapshots = ({
  tripId,
  filters = {},
  queryOptions = {},
  requestOptions = {},
} = {}) =>
  useQuery({
    queryKey: queryKeys.analytics.reportSnapshots(tripId || 'unknown', filters),
    queryFn: () => listReportSnapshots(tripId, filters, requestOptions),
    enabled: Boolean(tripId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  })

const useReportSnapshot = ({
  tripId,
  snapshotId,
  filters = {},
  queryOptions = {},
  requestOptions = {},
} = {}) =>
  useQuery({
    queryKey: queryKeys.analytics.reportSnapshot(tripId || 'unknown', snapshotId || 'unknown'),
    queryFn: () => getReportSnapshot(tripId, snapshotId, filters, requestOptions),
    enabled: Boolean(tripId && snapshotId) && (queryOptions.enabled ?? true),
    ...queryOptions,
  })

const useUpdateTripExchangeRate = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, body }) => updateTripExchangeRate(tripId, body, requestOptions),
      mutationOptions,
      onSuccess: async (_data, variables) => {
        await invalidateQueryScopes(queryClient, [
          queryKeys.analytics.exchangeRates(variables.tripId),
          queryKeys.organization.expenses(variables.tripId, {}),
          queryKeys.analytics.expenseAnalytics(variables.tripId, {}),
        ])
      },
    }),
  )
}

const useCreateCurrencyConversion = ({ mutationOptions = {}, requestOptions = {} } = {}) =>
  useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, body }) => createCurrencyConversion(tripId, body, requestOptions),
      mutationOptions,
    }),
  )

const useCreateReportSnapshot = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, body }) => createReportSnapshot(tripId, body, requestOptions),
      mutationOptions,
      onSuccess: async (_data, variables) => {
        await invalidateQueryScopes(queryClient, [
          queryKeys.analytics.reportSnapshots(variables.tripId, {}),
        ])
      },
    }),
  )
}

const useReportSnapshotDownload = ({ mutationOptions = {}, requestOptions = {} } = {}) =>
  useMutation(
    createMutationConfig({
      mutationFn: ({ tripId, snapshotId, filters = {} }) =>
        getReportSnapshotDownload(tripId, snapshotId, filters, requestOptions),
      mutationOptions,
    }),
  )

export {
  useCreateCurrencyConversion,
  useCreateReportSnapshot,
  useExpenseAnalytics,
  useReportSnapshot,
  useReportSnapshotDownload,
  useReportSnapshots,
  useSettlementReport,
  useTripExchangeRates,
  useUpdateTripExchangeRate,
}
