import express from 'express'

import {
  addActivityCard,
  addChecklistItem,
  createAttachment,
  createChecklist,
  createComment,
  createExpense,
  createItineraryDay,
  createReservation,
  createTripReportSnapshot,
  createTrip,
  convertCurrencyPreview,
  deactivateMember,
  getBudgetSummary,
  getExpenseAnalytics,
  getSettlementReport,
  getTripReportSnapshotById,
  getTripById,
  inviteMember,
  listActivitiesForDay,
  listAttachments,
  listChecklists,
  listComments,
  listExpenses,
  listInvitations,
  listItineraryDays,
  listMembers,
  listOrganizationOverview,
  listReservations,
  listTripExchangeRates,
  listTripReportSnapshots,
  listTrips,
  reactivateMember,
  reorderActivities,
  transferOwnership,
  updateChecklistItem,
  updateMemberRole,
  updateTrip,
  uploadAttachmentFile,
  upsertTripBudget,
  upsertTripExchangeRate,
} from '../controllers/index.js'
import {
  authorizeTripPermission,
  requireActor,
  uploadSingleAttachment,
} from '../middlewares/index.js'
import { TRIP_PERMISSIONS } from '../utils/index.js'
import {
  collaborationSchemas,
  organizationSchemas,
  tripSchemas,
  validateRequest,
} from '../validators/index.js'

const tripRouter = express.Router()

tripRouter.use(requireActor)

tripRouter
  .route('/')
  .post(validateRequest({ body: tripSchemas.create }), createTrip)
  .get(listTrips)

tripRouter
  .route('/:tripId')
  .get(
    validateRequest({ params: tripSchemas.tripIdParam }),
    authorizeTripPermission(TRIP_PERMISSIONS.VIEW_TRIP),
    getTripById,
  )
  .patch(
    validateRequest({ params: tripSchemas.tripIdParam, body: tripSchemas.update }),
    authorizeTripPermission(TRIP_PERMISSIONS.MANAGE_ITINERARY),
    updateTrip,
  )
  .put(
    validateRequest({ params: tripSchemas.tripIdParam, body: tripSchemas.update }),
    authorizeTripPermission(TRIP_PERMISSIONS.MANAGE_ITINERARY),
    updateTrip,
  )

tripRouter
  .route('/:tripId/days')
  .post(
    validateRequest({ params: tripSchemas.tripIdParam, body: tripSchemas.dayCreate }),
    authorizeTripPermission(TRIP_PERMISSIONS.MANAGE_ITINERARY),
    createItineraryDay,
  )
  .get(
    validateRequest({ params: tripSchemas.tripIdParam }),
    authorizeTripPermission(TRIP_PERMISSIONS.VIEW_TRIP),
    listItineraryDays,
  )

tripRouter
  .route('/:tripId/days/:dayId/activities')
  .post(
    validateRequest({ params: tripSchemas.tripAndDayParam, body: tripSchemas.activityCreate }),
    authorizeTripPermission(TRIP_PERMISSIONS.MANAGE_ITINERARY),
    addActivityCard,
  )
  .get(
    validateRequest({ params: tripSchemas.tripAndDayParam }),
    authorizeTripPermission(TRIP_PERMISSIONS.VIEW_TRIP),
    listActivitiesForDay,
  )

tripRouter.patch(
  '/:tripId/days/:dayId/activities/reorder',
  validateRequest({
    params: tripSchemas.tripAndDayParam,
    body: tripSchemas.activityReorder,
  }),
  authorizeTripPermission(TRIP_PERMISSIONS.MANAGE_ITINERARY),
  reorderActivities,
)

tripRouter
  .route('/:tripId/invitations')
  .post(
    validateRequest({ params: tripSchemas.tripIdParam, body: collaborationSchemas.inviteMember }),
    authorizeTripPermission(TRIP_PERMISSIONS.INVITE_MEMBERS),
    inviteMember,
  )
  .get(
    validateRequest({ params: tripSchemas.tripIdParam }),
    authorizeTripPermission(TRIP_PERMISSIONS.INVITE_MEMBERS),
    listInvitations,
  )

tripRouter
  .route('/:tripId/members')
  .get(
    validateRequest({ params: tripSchemas.tripIdParam }),
    authorizeTripPermission(TRIP_PERMISSIONS.VIEW_TRIP),
    listMembers,
  )

tripRouter.patch(
  '/:tripId/members/:memberId/role',
  validateRequest({
    params: tripSchemas.tripAndMemberParam,
    body: collaborationSchemas.updateMemberRole,
  }),
  authorizeTripPermission(TRIP_PERMISSIONS.MANAGE_MEMBER_ROLES),
  updateMemberRole,
)

tripRouter.delete(
  '/:tripId/members/:memberId',
  validateRequest({ params: tripSchemas.tripAndMemberParam }),
  authorizeTripPermission(TRIP_PERMISSIONS.MANAGE_MEMBER_ROLES),
  deactivateMember,
)

tripRouter.post(
  '/:tripId/members/:memberId/reactivate',
  validateRequest({ params: tripSchemas.tripAndMemberParam }),
  authorizeTripPermission(TRIP_PERMISSIONS.MANAGE_MEMBER_ROLES),
  reactivateMember,
)

tripRouter.post(
  '/:tripId/ownership/transfer',
  validateRequest({ params: tripSchemas.tripIdParam, body: collaborationSchemas.transferOwnership }),
  authorizeTripPermission(TRIP_PERMISSIONS.MANAGE_MEMBER_ROLES),
  transferOwnership,
)

tripRouter
  .route('/:tripId/comments')
  .post(
    validateRequest({ params: tripSchemas.tripIdParam, body: collaborationSchemas.createComment }),
    authorizeTripPermission(TRIP_PERMISSIONS.COMMENT),
    createComment,
  )
  .get(
    validateRequest({ params: tripSchemas.tripIdParam }),
    authorizeTripPermission(TRIP_PERMISSIONS.VIEW_TRIP),
    listComments,
  )

tripRouter
  .route('/:tripId/checklists')
  .post(
    validateRequest({ params: tripSchemas.tripIdParam, body: organizationSchemas.createChecklist }),
    authorizeTripPermission(TRIP_PERMISSIONS.MANAGE_ORGANIZATION),
    createChecklist,
  )
  .get(
    validateRequest({ params: tripSchemas.tripIdParam }),
    authorizeTripPermission(TRIP_PERMISSIONS.VIEW_TRIP),
    listChecklists,
  )

tripRouter.post(
  '/:tripId/checklists/:checklistId/items',
  validateRequest({
    params: tripSchemas.tripAndChecklistParam,
    body: organizationSchemas.addChecklistItem,
  }),
  authorizeTripPermission(TRIP_PERMISSIONS.MANAGE_ORGANIZATION),
  addChecklistItem,
)

tripRouter.patch(
  '/:tripId/checklists/:checklistId/items/:itemId',
  validateRequest({
    params: tripSchemas.tripChecklistItemParam,
    body: organizationSchemas.updateChecklistItem,
  }),
  authorizeTripPermission(TRIP_PERMISSIONS.MANAGE_ORGANIZATION),
  updateChecklistItem,
)

tripRouter
  .route('/:tripId/attachments')
  .post(
    validateRequest({ params: tripSchemas.tripIdParam, body: organizationSchemas.createAttachmentMeta }),
    authorizeTripPermission(TRIP_PERMISSIONS.MANAGE_ORGANIZATION),
    createAttachment,
  )
  .get(
    validateRequest({ params: tripSchemas.tripIdParam }),
    authorizeTripPermission(TRIP_PERMISSIONS.VIEW_TRIP),
    listAttachments,
  )

tripRouter.post(
  '/:tripId/attachments/upload',
  validateRequest({ params: tripSchemas.tripIdParam }),
  authorizeTripPermission(TRIP_PERMISSIONS.MANAGE_ORGANIZATION),
  uploadSingleAttachment,
  uploadAttachmentFile,
)

tripRouter
  .route('/:tripId/reservations')
  .post(
    validateRequest({ params: tripSchemas.tripIdParam, body: organizationSchemas.createReservation }),
    authorizeTripPermission(TRIP_PERMISSIONS.MANAGE_ORGANIZATION),
    createReservation,
  )
  .get(
    validateRequest({ params: tripSchemas.tripIdParam }),
    authorizeTripPermission(TRIP_PERMISSIONS.VIEW_TRIP),
    listReservations,
  )

tripRouter
  .route('/:tripId/expenses')
  .post(
    validateRequest({ params: tripSchemas.tripIdParam, body: organizationSchemas.createExpense }),
    authorizeTripPermission(TRIP_PERMISSIONS.MANAGE_ORGANIZATION),
    createExpense,
  )
  .get(
    validateRequest({ params: tripSchemas.tripIdParam }),
    authorizeTripPermission(TRIP_PERMISSIONS.VIEW_TRIP),
    listExpenses,
  )

tripRouter
  .route('/:tripId/budget')
  .put(
    validateRequest({ params: tripSchemas.tripIdParam, body: organizationSchemas.upsertBudget }),
    authorizeTripPermission(TRIP_PERMISSIONS.MANAGE_ORGANIZATION),
    upsertTripBudget,
  )

tripRouter.get(
  '/:tripId/budget/summary',
  validateRequest({ params: tripSchemas.tripIdParam }),
  authorizeTripPermission(TRIP_PERMISSIONS.VIEW_TRIP),
  getBudgetSummary,
)

tripRouter.get(
  '/:tripId/organization/overview',
  validateRequest({ params: tripSchemas.tripIdParam }),
  authorizeTripPermission(TRIP_PERMISSIONS.VIEW_TRIP),
  listOrganizationOverview,
)

tripRouter
  .route('/:tripId/exchange-rates')
  .put(
    validateRequest({
      params: tripSchemas.tripIdParam,
      body: organizationSchemas.upsertExchangeRate,
    }),
    authorizeTripPermission(TRIP_PERMISSIONS.MANAGE_ORGANIZATION),
    upsertTripExchangeRate,
  )
  .get(
    validateRequest({ params: tripSchemas.tripIdParam }),
    authorizeTripPermission(TRIP_PERMISSIONS.VIEW_TRIP),
    listTripExchangeRates,
  )

tripRouter.post(
  '/:tripId/currency/convert',
  validateRequest({
    params: tripSchemas.tripIdParam,
    body: organizationSchemas.convertCurrencyPreview,
  }),
  authorizeTripPermission(TRIP_PERMISSIONS.VIEW_TRIP),
  convertCurrencyPreview,
)

tripRouter.get(
  '/:tripId/analytics/expenses',
  validateRequest({
    params: tripSchemas.tripIdParam,
    query: organizationSchemas.analyticsQuery,
  }),
  authorizeTripPermission(TRIP_PERMISSIONS.VIEW_TRIP),
  getExpenseAnalytics,
)

tripRouter.get(
  '/:tripId/settlement',
  validateRequest({ params: tripSchemas.tripIdParam }),
  authorizeTripPermission(TRIP_PERMISSIONS.VIEW_TRIP),
  getSettlementReport,
)

tripRouter
  .route('/:tripId/reports/snapshots')
  .post(
    validateRequest({
      params: tripSchemas.tripIdParam,
      body: organizationSchemas.reportSnapshotCreate,
    }),
    authorizeTripPermission(TRIP_PERMISSIONS.VIEW_TRIP),
    createTripReportSnapshot,
  )
  .get(
    validateRequest({
      params: tripSchemas.tripIdParam,
      query: organizationSchemas.reportSnapshotQuery,
    }),
    authorizeTripPermission(TRIP_PERMISSIONS.VIEW_TRIP),
    listTripReportSnapshots,
  )

tripRouter.get(
  '/:tripId/reports/snapshots/:snapshotId',
  validateRequest({
    params: tripSchemas.tripAndSnapshotParam,
    query: organizationSchemas.reportSnapshotQuery,
  }),
  authorizeTripPermission(TRIP_PERMISSIONS.VIEW_TRIP),
  getTripReportSnapshotById,
)

export { tripRouter }
