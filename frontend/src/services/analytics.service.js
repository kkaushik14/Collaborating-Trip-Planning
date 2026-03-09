import { apiRequest, ensureArray, ensureObject } from './service-utils.js'

const normalizeEntity = (value) => {
  const entity = ensureObject(value)
  return Object.keys(entity).length ? entity : null
}

const updateTripExchangeRate = (tripId, body, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/exchange-rates`,
      method: 'PUT',
      body,
      ...options,
    },
    {
      resource: 'analytics',
      operation: 'updateTripExchangeRate',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          exchangeRate: normalizeEntity(payload.exchangeRate),
        }
      },
    },
  )

const listTripExchangeRates = (tripId, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/exchange-rates`,
      method: 'GET',
      ...options,
    },
    {
      resource: 'analytics',
      operation: 'listTripExchangeRates',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          exchangeRates: ensureArray(payload.exchangeRates),
        }
      },
    },
  )

const createCurrencyConversion = (tripId, body, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/currency/convert`,
      method: 'POST',
      body,
      ...options,
    },
    {
      resource: 'analytics',
      operation: 'createCurrencyConversion',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          conversion: normalizeEntity(payload.conversion),
        }
      },
    },
  )

const getExpenseAnalytics = (tripId, query = {}, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/analytics/expenses`,
      method: 'GET',
      query,
      ...options,
    },
    {
      resource: 'analytics',
      operation: 'getExpenseAnalytics',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          analytics: normalizeEntity(payload.analytics),
        }
      },
    },
  )

const getSettlementReport = (tripId, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/settlement`,
      method: 'GET',
      ...options,
    },
    {
      resource: 'analytics',
      operation: 'getSettlementReport',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          settlement: normalizeEntity(payload.settlement),
        }
      },
    },
  )

const createReportSnapshot = (tripId, body, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/reports/snapshots`,
      method: 'POST',
      body,
      ...options,
    },
    {
      resource: 'analytics',
      operation: 'createReportSnapshot',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          snapshot: normalizeEntity(payload.snapshot),
        }
      },
    },
  )

const listReportSnapshots = (tripId, query = {}, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/reports/snapshots`,
      method: 'GET',
      query,
      ...options,
    },
    {
      resource: 'analytics',
      operation: 'listReportSnapshots',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          snapshots: ensureArray(payload.snapshots),
        }
      },
    },
  )

const getReportSnapshot = (tripId, snapshotId, query = {}, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/reports/snapshots/${snapshotId}`,
      method: 'GET',
      query,
      ...options,
    },
    {
      resource: 'analytics',
      operation: 'getReportSnapshot',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          snapshot: normalizeEntity(payload.snapshot),
        }
      },
    },
  )

const getReportSnapshotDownload = async (tripId, snapshotId, query = {}, options = {}) => {
  const response = await apiRequest(
    {
      path: `/api/v1/trips/${tripId}/reports/snapshots/${snapshotId}`,
      method: 'GET',
      query: {
        ...query,
        download: true,
      },
      ...options,
    },
    {
      resource: 'analytics',
      operation: 'getReportSnapshotDownload',
      expectEnvelope: false,
      includeEnvelope: true,
      normalize: (value) => value,
    },
  )

  return {
    contentType: response.contentType,
    content: response.data,
  }
}

export {
  createCurrencyConversion,
  createReportSnapshot,
  getExpenseAnalytics,
  getReportSnapshot,
  getReportSnapshotDownload,
  getSettlementReport,
  listReportSnapshots,
  listTripExchangeRates,
  updateTripExchangeRate,
}
