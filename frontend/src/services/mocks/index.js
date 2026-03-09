import analytics from './analytics.json'
import auth from './auth.json'
import collaboration from './collaboration.json'
import errors from './errors.json'
import invitations from './invitations.json'
import itinerary from './itinerary.json'
import organization from './organization.json'
import system from './system.json'
import trips from './trips.json'

const RESOURCE_MOCKS = Object.freeze({
  analytics,
  auth,
  collaboration,
  errors,
  invitations,
  itinerary,
  organization,
  system,
  trips,
})

const ROUTE_DEFINITIONS = Object.freeze([
  { method: 'GET', pattern: /^\/$/, key: 'GET /' },
  { method: 'GET', pattern: /^\/health$/, key: 'GET /health' },
  { method: 'GET', pattern: /^\/metrics$/, key: 'GET /metrics' },
  { method: 'GET', pattern: /^\/api\/v1\/health$/, key: 'GET /api/v1/health' },
  { method: 'GET', pattern: /^\/api\/v1\/openapi\.json$/, key: 'GET /api/v1/openapi.json' },
  { method: 'GET', pattern: /^\/api\/v1\/docs$/, key: 'GET /api/v1/docs' },
  { method: 'GET', pattern: /^\/uploads\/[^/]+$/, key: 'GET /uploads/:fileName' },

  { method: 'POST', pattern: /^\/api\/v1\/auth\/register$/, key: 'POST /api/v1/auth/register' },
  { method: 'POST', pattern: /^\/api\/v1\/auth\/login$/, key: 'POST /api/v1/auth/login' },
  { method: 'POST', pattern: /^\/api\/v1\/auth\/refresh$/, key: 'POST /api/v1/auth/refresh' },
  { method: 'POST', pattern: /^\/api\/v1\/auth\/logout$/, key: 'POST /api/v1/auth/logout' },
  { method: 'GET', pattern: /^\/api\/v1\/auth\/me$/, key: 'GET /api/v1/auth/me' },

  { method: 'GET', pattern: /^\/api\/v1\/invitations\/mine$/, key: 'GET /api/v1/invitations/mine' },
  { method: 'POST', pattern: /^\/api\/v1\/invitations\/accept$/, key: 'POST /api/v1/invitations/accept' },

  { method: 'POST', pattern: /^\/api\/v1\/trips$/, key: 'POST /api/v1/trips' },
  { method: 'GET', pattern: /^\/api\/v1\/trips$/, key: 'GET /api/v1/trips' },
  { method: 'GET', pattern: /^\/api\/v1\/trips\/[^/]+$/, key: 'GET /api/v1/trips/:tripId' },
  { method: 'PATCH', pattern: /^\/api\/v1\/trips\/[^/]+$/, key: 'PATCH /api/v1/trips/:tripId' },
  { method: 'PUT', pattern: /^\/api\/v1\/trips\/[^/]+$/, key: 'PUT /api/v1/trips/:tripId' },

  { method: 'POST', pattern: /^\/api\/v1\/trips\/[^/]+\/days$/, key: 'POST /api/v1/trips/:tripId/days' },
  { method: 'GET', pattern: /^\/api\/v1\/trips\/[^/]+\/days$/, key: 'GET /api/v1/trips/:tripId/days' },
  {
    method: 'POST',
    pattern: /^\/api\/v1\/trips\/[^/]+\/days\/[^/]+\/activities$/,
    key: 'POST /api/v1/trips/:tripId/days/:dayId/activities',
  },
  {
    method: 'GET',
    pattern: /^\/api\/v1\/trips\/[^/]+\/days\/[^/]+\/activities$/,
    key: 'GET /api/v1/trips/:tripId/days/:dayId/activities',
  },
  {
    method: 'PATCH',
    pattern: /^\/api\/v1\/trips\/[^/]+\/days\/[^/]+\/activities\/reorder$/,
    key: 'PATCH /api/v1/trips/:tripId/days/:dayId/activities/reorder',
  },

  {
    method: 'POST',
    pattern: /^\/api\/v1\/trips\/[^/]+\/invitations$/,
    key: 'POST /api/v1/trips/:tripId/invitations',
  },
  {
    method: 'GET',
    pattern: /^\/api\/v1\/trips\/[^/]+\/invitations$/,
    key: 'GET /api/v1/trips/:tripId/invitations',
  },
  {
    method: 'GET',
    pattern: /^\/api\/v1\/trips\/[^/]+\/members$/,
    key: 'GET /api/v1/trips/:tripId/members',
  },
  {
    method: 'PATCH',
    pattern: /^\/api\/v1\/trips\/[^/]+\/members\/[^/]+\/role$/,
    key: 'PATCH /api/v1/trips/:tripId/members/:memberId/role',
  },
  {
    method: 'DELETE',
    pattern: /^\/api\/v1\/trips\/[^/]+\/members\/[^/]+$/,
    key: 'DELETE /api/v1/trips/:tripId/members/:memberId',
  },
  {
    method: 'POST',
    pattern: /^\/api\/v1\/trips\/[^/]+\/members\/[^/]+\/reactivate$/,
    key: 'POST /api/v1/trips/:tripId/members/:memberId/reactivate',
  },
  {
    method: 'POST',
    pattern: /^\/api\/v1\/trips\/[^/]+\/ownership\/transfer$/,
    key: 'POST /api/v1/trips/:tripId/ownership/transfer',
  },
  {
    method: 'POST',
    pattern: /^\/api\/v1\/trips\/[^/]+\/comments$/,
    key: 'POST /api/v1/trips/:tripId/comments',
  },
  {
    method: 'GET',
    pattern: /^\/api\/v1\/trips\/[^/]+\/comments$/,
    key: 'GET /api/v1/trips/:tripId/comments',
  },

  {
    method: 'POST',
    pattern: /^\/api\/v1\/trips\/[^/]+\/checklists$/,
    key: 'POST /api/v1/trips/:tripId/checklists',
  },
  {
    method: 'GET',
    pattern: /^\/api\/v1\/trips\/[^/]+\/checklists$/,
    key: 'GET /api/v1/trips/:tripId/checklists',
  },
  {
    method: 'POST',
    pattern: /^\/api\/v1\/trips\/[^/]+\/checklists\/[^/]+\/items$/,
    key: 'POST /api/v1/trips/:tripId/checklists/:checklistId/items',
  },
  {
    method: 'PATCH',
    pattern: /^\/api\/v1\/trips\/[^/]+\/checklists\/[^/]+\/items\/[^/]+$/,
    key: 'PATCH /api/v1/trips/:tripId/checklists/:checklistId/items/:itemId',
  },

  {
    method: 'POST',
    pattern: /^\/api\/v1\/trips\/[^/]+\/attachments$/,
    key: 'POST /api/v1/trips/:tripId/attachments',
  },
  {
    method: 'GET',
    pattern: /^\/api\/v1\/trips\/[^/]+\/attachments$/,
    key: 'GET /api/v1/trips/:tripId/attachments',
  },
  {
    method: 'POST',
    pattern: /^\/api\/v1\/trips\/[^/]+\/attachments\/upload$/,
    key: 'POST /api/v1/trips/:tripId/attachments/upload',
  },

  {
    method: 'POST',
    pattern: /^\/api\/v1\/trips\/[^/]+\/reservations$/,
    key: 'POST /api/v1/trips/:tripId/reservations',
  },
  {
    method: 'GET',
    pattern: /^\/api\/v1\/trips\/[^/]+\/reservations$/,
    key: 'GET /api/v1/trips/:tripId/reservations',
  },
  {
    method: 'POST',
    pattern: /^\/api\/v1\/trips\/[^/]+\/expenses$/,
    key: 'POST /api/v1/trips/:tripId/expenses',
  },
  {
    method: 'GET',
    pattern: /^\/api\/v1\/trips\/[^/]+\/expenses$/,
    key: 'GET /api/v1/trips/:tripId/expenses',
  },
  {
    method: 'PUT',
    pattern: /^\/api\/v1\/trips\/[^/]+\/budget$/,
    key: 'PUT /api/v1/trips/:tripId/budget',
  },
  {
    method: 'GET',
    pattern: /^\/api\/v1\/trips\/[^/]+\/budget\/summary$/,
    key: 'GET /api/v1/trips/:tripId/budget/summary',
  },
  {
    method: 'GET',
    pattern: /^\/api\/v1\/trips\/[^/]+\/organization\/overview$/,
    key: 'GET /api/v1/trips/:tripId/organization/overview',
  },

  {
    method: 'PUT',
    pattern: /^\/api\/v1\/trips\/[^/]+\/exchange-rates$/,
    key: 'PUT /api/v1/trips/:tripId/exchange-rates',
  },
  {
    method: 'GET',
    pattern: /^\/api\/v1\/trips\/[^/]+\/exchange-rates$/,
    key: 'GET /api/v1/trips/:tripId/exchange-rates',
  },
  {
    method: 'POST',
    pattern: /^\/api\/v1\/trips\/[^/]+\/currency\/convert$/,
    key: 'POST /api/v1/trips/:tripId/currency/convert',
  },
  {
    method: 'GET',
    pattern: /^\/api\/v1\/trips\/[^/]+\/analytics\/expenses$/,
    key: 'GET /api/v1/trips/:tripId/analytics/expenses',
  },
  {
    method: 'GET',
    pattern: /^\/api\/v1\/trips\/[^/]+\/settlement$/,
    key: 'GET /api/v1/trips/:tripId/settlement',
  },
  {
    method: 'POST',
    pattern: /^\/api\/v1\/trips\/[^/]+\/reports\/snapshots$/,
    key: 'POST /api/v1/trips/:tripId/reports/snapshots',
  },
  {
    method: 'GET',
    pattern: /^\/api\/v1\/trips\/[^/]+\/reports\/snapshots$/,
    key: 'GET /api/v1/trips/:tripId/reports/snapshots',
  },
  {
    method: 'GET',
    pattern: /^\/api\/v1\/trips\/[^/]+\/reports\/snapshots\/[^/]+$/,
    key: 'GET /api/v1/trips/:tripId/reports/snapshots/:snapshotId',
  },
])

const deepClone = (value) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value))
}

const routeResponseMap = new Map()

for (const bundle of Object.values(RESOURCE_MOCKS)) {
  if (!bundle?.responses) {
    continue
  }

  for (const [key, response] of Object.entries(bundle.responses)) {
    routeResponseMap.set(key, response)
  }
}

const resolveRouteKey = ({ method, path, searchParams }) => {
  const normalizedMethod = method.toUpperCase()

  if (
    normalizedMethod === 'GET' &&
    /\/api\/v1\/trips\/[^/]+\/reports\/snapshots\/[^/]+$/.test(path) &&
    searchParams.get('download') === 'true'
  ) {
    return 'GET /api/v1/trips/:tripId/reports/snapshots/:snapshotId?download=true'
  }

  const directKey = `${normalizedMethod} ${path}`
  if (routeResponseMap.has(directKey)) {
    return directKey
  }

  for (const definition of ROUTE_DEFINITIONS) {
    if (definition.method !== normalizedMethod) {
      continue
    }

    if (definition.pattern.test(path)) {
      return definition.key
    }
  }

  return null
}

const notFoundFallback = routeResponseMap.get('404 Not found')

const getMockResponse = ({ method = 'GET', path = '/', query = {} }) => {
  const queryString = new URLSearchParams(query).toString()
  const url = new URL(path.startsWith('http') ? path : `http://localhost${path}`)

  if (!path.startsWith('http')) {
    url.search = queryString
  }

  const routeKey = resolveRouteKey({
    method,
    path: url.pathname,
    searchParams: url.searchParams,
  })

  if (!routeKey) {
    return deepClone(notFoundFallback)
  }

  return deepClone(routeResponseMap.get(routeKey))
}

const getAllMockResources = () => deepClone(RESOURCE_MOCKS)

export {
  RESOURCE_MOCKS,
  getAllMockResources,
  getMockResponse,
}
