import { apiRequest, ensureArray, ensureNumber, ensureObject } from './service-utils.js'

const normalizeEntity = (value) => {
  const entity = ensureObject(value)
  return Object.keys(entity).length ? entity : null
}

const createChecklist = (tripId, body, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/checklists`,
      method: 'POST',
      body,
      ...options,
    },
    {
      resource: 'organization',
      operation: 'createChecklist',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          checklist: normalizeEntity(payload.checklist),
        }
      },
    },
  )

const listChecklists = (tripId, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/checklists`,
      method: 'GET',
      ...options,
    },
    {
      resource: 'organization',
      operation: 'listChecklists',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          checklists: ensureArray(payload.checklists),
        }
      },
    },
  )

const createChecklistItem = (tripId, checklistId, body, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/checklists/${checklistId}/items`,
      method: 'POST',
      body,
      ...options,
    },
    {
      resource: 'organization',
      operation: 'createChecklistItem',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          item: normalizeEntity(payload.item),
          checklist: normalizeEntity(payload.checklist),
        }
      },
    },
  )

const updateChecklistItem = (tripId, checklistId, itemId, body, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/checklists/${checklistId}/items/${itemId}`,
      method: 'PATCH',
      body,
      ...options,
    },
    {
      resource: 'organization',
      operation: 'updateChecklistItem',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          item: normalizeEntity(payload.item),
          checklist: normalizeEntity(payload.checklist),
        }
      },
    },
  )

const createAttachment = (tripId, body, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/attachments`,
      method: 'POST',
      body,
      ...options,
    },
    {
      resource: 'organization',
      operation: 'createAttachment',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          attachment: normalizeEntity(payload.attachment),
        }
      },
    },
  )

const listAttachments = (tripId, query = {}, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/attachments`,
      method: 'GET',
      query,
      ...options,
    },
    {
      resource: 'organization',
      operation: 'listAttachments',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          attachments: ensureArray(payload.attachments),
        }
      },
    },
  )

const createAttachmentUpload = (tripId, formData, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/attachments/upload`,
      method: 'POST',
      body: formData,
      ...options,
    },
    {
      resource: 'organization',
      operation: 'createAttachmentUpload',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          attachment: normalizeEntity(payload.attachment),
        }
      },
    },
  )

const createReservation = (tripId, body, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/reservations`,
      method: 'POST',
      body,
      ...options,
    },
    {
      resource: 'organization',
      operation: 'createReservation',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          reservation: normalizeEntity(payload.reservation),
        }
      },
    },
  )

const listReservations = (tripId, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/reservations`,
      method: 'GET',
      ...options,
    },
    {
      resource: 'organization',
      operation: 'listReservations',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          reservations: ensureArray(payload.reservations),
        }
      },
    },
  )

const createExpense = (tripId, body, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/expenses`,
      method: 'POST',
      body,
      ...options,
    },
    {
      resource: 'organization',
      operation: 'createExpense',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          expense: normalizeEntity(payload.expense),
          conversion: normalizeEntity(payload.conversion),
          budgetSummary: normalizeEntity(payload.budgetSummary),
          tripBudget: normalizeEntity(payload.tripBudget),
        }
      },
    },
  )

const listExpenses = async (tripId, query = {}, options = {}) => {
  const response = await apiRequest(
    {
      path: `/api/v1/trips/${tripId}/expenses`,
      method: 'GET',
      query,
      ...options,
    },
    {
      resource: 'organization',
      operation: 'listExpenses',
      defaultData: {},
      includeEnvelope: true,
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          expenses: ensureArray(payload.expenses),
        }
      },
    },
  )

  return {
    expenses: response.data.expenses,
    meta: response.meta,
  }
}

const updateTripBudget = (tripId, body, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/budget`,
      method: 'PUT',
      body,
      ...options,
    },
    {
      resource: 'organization',
      operation: 'updateTripBudget',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          budget: normalizeEntity(payload.budget),
          summary: normalizeEntity(payload.summary),
        }
      },
    },
  )

const getTripBudgetSummary = (tripId, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/budget/summary`,
      method: 'GET',
      ...options,
    },
    {
      resource: 'organization',
      operation: 'getTripBudgetSummary',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          budget: normalizeEntity(payload.budget),
          summary: normalizeEntity(payload.summary),
          utilizationPercent: ensureNumber(payload.utilizationPercent, 0),
        }
      },
    },
  )

const getTripOrganizationOverview = (tripId, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/organization/overview`,
      method: 'GET',
      ...options,
    },
    {
      resource: 'organization',
      operation: 'getTripOrganizationOverview',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          checklists: ensureNumber(payload.checklists, 0),
          attachments: ensureNumber(payload.attachments, 0),
          reservations: ensureNumber(payload.reservations, 0),
          expenses: normalizeEntity(payload.expenses),
        }
      },
    },
  )

export {
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
}
