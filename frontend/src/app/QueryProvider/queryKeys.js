const normalizeParams = (value = {}) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return Object.keys(value)
    .sort()
    .reduce((accumulator, key) => {
      const paramValue = value[key]
      if (paramValue === undefined || paramValue === null || paramValue === '') {
        return accumulator
      }

      accumulator[key] = paramValue
      return accumulator
    }, {})
}

const queryKeys = Object.freeze({
  system: {
    root: () => ['system'],
    banner: () => ['system', 'banner'],
    health: () => ['system', 'health'],
    versionedHealth: () => ['system', 'versioned-health'],
    metrics: () => ['system', 'metrics'],
    openApi: () => ['system', 'openapi'],
    docs: () => ['system', 'docs'],
    uploadFile: (fileName) => ['system', 'uploads', fileName],
  },

  auth: {
    root: () => ['auth'],
    me: () => ['auth', 'me'],
  },

  invitations: {
    root: () => ['invitations'],
    mine: () => ['invitations', 'mine'],
  },

  trips: {
    root: () => ['trips'],
    list: (filters = {}) => ['trips', 'list', normalizeParams(filters)],
    detail: (tripId) => ['trips', 'detail', tripId],
  },

  itinerary: {
    root: (tripId) => ['itinerary', tripId],
    days: (tripId) => ['itinerary', tripId, 'days'],
    activities: (tripId, dayId) => ['itinerary', tripId, 'days', dayId, 'activities'],
  },

  collaboration: {
    root: (tripId) => ['collaboration', tripId],
    invitations: (tripId) => ['collaboration', tripId, 'invitations'],
    members: (tripId) => ['collaboration', tripId, 'members'],
    comments: (tripId, filters = {}) => ['collaboration', tripId, 'comments', normalizeParams(filters)],
  },

  organization: {
    root: (tripId) => ['organization', tripId],
    checklists: (tripId) => ['organization', tripId, 'checklists'],
    attachments: (tripId, filters = {}) => ['organization', tripId, 'attachments', normalizeParams(filters)],
    reservations: (tripId) => ['organization', tripId, 'reservations'],
    expenses: (tripId, filters = {}) => ['organization', tripId, 'expenses', normalizeParams(filters)],
    budgetSummary: (tripId) => ['organization', tripId, 'budget-summary'],
    overview: (tripId) => ['organization', tripId, 'overview'],
  },

  analytics: {
    root: (tripId) => ['analytics', tripId],
    exchangeRates: (tripId) => ['analytics', tripId, 'exchange-rates'],
    expenseAnalytics: (tripId, filters = {}) => ['analytics', tripId, 'expense-analytics', normalizeParams(filters)],
    settlement: (tripId) => ['analytics', tripId, 'settlement'],
    reportSnapshots: (tripId, filters = {}) => ['analytics', tripId, 'report-snapshots', normalizeParams(filters)],
    reportSnapshot: (tripId, snapshotId) => ['analytics', tripId, 'report-snapshots', snapshotId],
  },
})

export { queryKeys, normalizeParams }
