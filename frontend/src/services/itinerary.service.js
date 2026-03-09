import { apiRequest, ensureArray, ensureObject } from './service-utils.js'

const normalizeEntity = (value) => {
  const entity = ensureObject(value)
  return Object.keys(entity).length ? entity : null
}

const createItineraryDay = (tripId, body, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/days`,
      method: 'POST',
      body,
      ...options,
    },
    {
      resource: 'itinerary',
      operation: 'createItineraryDay',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          day: normalizeEntity(payload.day),
        }
      },
    },
  )

const listItineraryDays = (tripId, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/days`,
      method: 'GET',
      ...options,
    },
    {
      resource: 'itinerary',
      operation: 'listItineraryDays',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          days: ensureArray(payload.days),
        }
      },
    },
  )

const createActivityCard = (tripId, dayId, body, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/days/${dayId}/activities`,
      method: 'POST',
      body,
      ...options,
    },
    {
      resource: 'itinerary',
      operation: 'createActivityCard',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          activity: normalizeEntity(payload.activity),
        }
      },
    },
  )

const listActivitiesForDay = (tripId, dayId, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/days/${dayId}/activities`,
      method: 'GET',
      ...options,
    },
    {
      resource: 'itinerary',
      operation: 'listActivitiesForDay',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          day: normalizeEntity(payload.day),
          activities: ensureArray(payload.activities),
        }
      },
    },
  )

const updateActivityOrder = (tripId, dayId, body, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/days/${dayId}/activities/reorder`,
      method: 'PATCH',
      body,
      ...options,
    },
    {
      resource: 'itinerary',
      operation: 'updateActivityOrder',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          day: normalizeEntity(payload.day),
          activities: ensureArray(payload.activities),
        }
      },
    },
  )

export {
  createActivityCard,
  createItineraryDay,
  listActivitiesForDay,
  listItineraryDays,
  updateActivityOrder,
}
