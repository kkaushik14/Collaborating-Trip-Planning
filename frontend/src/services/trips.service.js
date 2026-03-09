import { apiRequest, ensureArray, ensureObject } from './service-utils.js'

const normalizeEntity = (value) => {
  const entity = ensureObject(value)
  return Object.keys(entity).length ? entity : null
}

const createTrip = (body, options = {}) =>
  apiRequest(
    {
      path: '/api/v1/trips',
      method: 'POST',
      body,
      ...options,
    },
    {
      resource: 'trips',
      operation: 'createTrip',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          trip: normalizeEntity(payload.trip),
        }
      },
    },
  )

const listTrips = (options = {}) =>
  apiRequest(
    {
      path: '/api/v1/trips',
      method: 'GET',
      ...options,
    },
    {
      resource: 'trips',
      operation: 'listTrips',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          trips: ensureArray(payload.trips),
        }
      },
    },
  )

const getTrip = (tripId, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}`,
      method: 'GET',
      ...options,
    },
    {
      resource: 'trips',
      operation: 'getTrip',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          trip: normalizeEntity(payload.trip),
          actorRole: payload.actorRole || null,
        }
      },
    },
  )

const updateTrip = (tripId, body, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}`,
      method: 'PATCH',
      body,
      ...options,
    },
    {
      resource: 'trips',
      operation: 'updateTrip',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          trip: normalizeEntity(payload.trip),
        }
      },
    },
  )

const replaceTrip = (tripId, body, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}`,
      method: 'PUT',
      body,
      ...options,
    },
    {
      resource: 'trips',
      operation: 'replaceTrip',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          trip: normalizeEntity(payload.trip),
        }
      },
    },
  )

export {
  createTrip,
  getTrip,
  listTrips,
  replaceTrip,
  updateTrip,
}
