import test from 'node:test'
import assert from 'node:assert/strict'

import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'

import { app } from '../src/app.js'

let mongoServer

const buildAuthHeader = (accessToken) => ({
  Authorization: `Bearer ${accessToken}`,
})

const registerUser = async ({ name, email, password }) => {
  const response = await request(app).post('/api/v1/auth/register').send({
    name,
    email,
    password,
  })

  assert.equal(response.statusCode, 201)

  return {
    user: response.body.data.user,
    accessToken: response.body.data.tokens.accessToken,
    refreshToken: response.body.data.tokens.refreshToken,
  }
}

test.before(async () => {
  mongoServer = await MongoMemoryServer.create()

  await mongoose.connect(mongoServer.getUri(), {
    dbName: 'trip-planning-test',
  })
})

test.after(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

test.beforeEach(async () => {
  await mongoose.connection.db.dropDatabase()
})

test('Trip planning flow: auth + create/list/update trip + itinerary + activity reorder', async () => {
  const owner = await registerUser({
    name: 'Owner User',
    email: 'owner+trip@example.com',
    password: 'Password123!',
  })

  const tripResponse = await request(app)
    .post('/api/v1/trips')
    .set(buildAuthHeader(owner.accessToken))
    .send({
      title: 'Japan Trip',
      startDate: '2026-06-10T00:00:00.000Z',
      endDate: '2026-06-20T00:00:00.000Z',
      travelers: 3,
    })

  assert.equal(tripResponse.statusCode, 201)
  const tripId = tripResponse.body.data.trip._id

  const listTripsResponse = await request(app)
    .get('/api/v1/trips')
    .set(buildAuthHeader(owner.accessToken))

  assert.equal(listTripsResponse.statusCode, 200)
  assert.equal(listTripsResponse.body.data.trips.length, 1)

  const updateTripResponse = await request(app)
    .patch(`/api/v1/trips/${tripId}`)
    .set(buildAuthHeader(owner.accessToken))
    .send({
      title: 'Japan Trip Updated',
      travelerCount: 4,
      visibility: 'shared',
    })

  assert.equal(updateTripResponse.statusCode, 200)
  assert.equal(updateTripResponse.body.data.trip.title, 'Japan Trip Updated')

  const dayResponse = await request(app)
    .post(`/api/v1/trips/${tripId}/days`)
    .set(buildAuthHeader(owner.accessToken))
    .send({
      dayNumber: 1,
      date: '2026-06-10T00:00:00.000Z',
      title: 'Arrival day',
    })

  assert.equal(dayResponse.statusCode, 201)
  const dayId = dayResponse.body.data.day._id

  const activityOne = await request(app)
    .post(`/api/v1/trips/${tripId}/days/${dayId}/activities`)
    .set(buildAuthHeader(owner.accessToken))
    .send({
      title: 'Hotel check-in',
    })

  assert.equal(activityOne.statusCode, 201)
  const activityOneId = activityOne.body.data.activity._id

  const activityTwo = await request(app)
    .post(`/api/v1/trips/${tripId}/days/${dayId}/activities`)
    .set(buildAuthHeader(owner.accessToken))
    .send({
      title: 'Dinner at Ginza',
    })

  assert.equal(activityTwo.statusCode, 201)
  const activityTwoId = activityTwo.body.data.activity._id

  const reorderResponse = await request(app)
    .patch(`/api/v1/trips/${tripId}/days/${dayId}/activities/reorder`)
    .set(buildAuthHeader(owner.accessToken))
    .send({
      activityIds: [activityTwoId, activityOneId],
    })

  assert.equal(reorderResponse.statusCode, 200)
  assert.equal(reorderResponse.body.data.activities[0]._id, activityTwoId)
})

test('Collaboration flow: invite + accept + role update + ownership transfer + member deactivate/reactivate', async () => {
  const owner = await registerUser({
    name: 'Owner User',
    email: 'owner+collab@example.com',
    password: 'Password123!',
  })

  const collaborator = await registerUser({
    name: 'Collab User',
    email: 'collab@example.com',
    password: 'Password123!',
  })

  const tripResponse = await request(app)
    .post('/api/v1/trips')
    .set(buildAuthHeader(owner.accessToken))
    .send({
      title: 'Paris Team Trip',
      startDate: '2026-07-01T00:00:00.000Z',
      endDate: '2026-07-05T00:00:00.000Z',
      travelers: 4,
    })

  const tripId = tripResponse.body.data.trip._id

  const inviteResponse = await request(app)
    .post(`/api/v1/trips/${tripId}/invitations`)
    .set(buildAuthHeader(owner.accessToken))
    .send({
      email: collaborator.user.email,
      role: 'EDITOR',
    })

  assert.equal(inviteResponse.statusCode, 201)
  const inviteToken = inviteResponse.body.data.inviteToken

  const myInvites = await request(app)
    .get('/api/v1/invitations/mine')
    .set(buildAuthHeader(collaborator.accessToken))

  assert.equal(myInvites.statusCode, 200)
  assert.equal(myInvites.body.data.invitations.length, 1)

  const acceptResponse = await request(app)
    .post('/api/v1/invitations/accept')
    .set(buildAuthHeader(collaborator.accessToken))
    .send({ token: inviteToken })

  assert.equal(acceptResponse.statusCode, 200)

  const membersBeforeTransfer = await request(app)
    .get(`/api/v1/trips/${tripId}/members`)
    .set(buildAuthHeader(owner.accessToken))

  assert.equal(membersBeforeTransfer.statusCode, 200)
  assert.equal(membersBeforeTransfer.body.data.members.length, 2)

  const collabMember = membersBeforeTransfer.body.data.members.find(
    (member) => member.user === collaborator.user._id,
  )

  const roleUpdateResponse = await request(app)
    .patch(`/api/v1/trips/${tripId}/members/${collabMember._id}/role`)
    .set(buildAuthHeader(owner.accessToken))
    .send({ role: 'VIEWER' })

  assert.equal(roleUpdateResponse.statusCode, 200)
  assert.equal(roleUpdateResponse.body.data.member.role, 'VIEWER')

  const transferResponse = await request(app)
    .post(`/api/v1/trips/${tripId}/ownership/transfer`)
    .set(buildAuthHeader(owner.accessToken))
    .send({ newOwnerUserId: collaborator.user._id })

  assert.equal(transferResponse.statusCode, 200)
  assert.equal(transferResponse.body.data.trip.owner, collaborator.user._id)

  const membersAfterTransfer = await request(app)
    .get(`/api/v1/trips/${tripId}/members`)
    .set(buildAuthHeader(collaborator.accessToken))

  const previousOwnerMember = membersAfterTransfer.body.data.members.find(
    (member) => member.user === owner.user._id,
  )

  const deactivateResponse = await request(app)
    .delete(`/api/v1/trips/${tripId}/members/${previousOwnerMember._id}`)
    .set(buildAuthHeader(collaborator.accessToken))

  assert.equal(deactivateResponse.statusCode, 200)
  assert.equal(deactivateResponse.body.data.member.isActive, false)

  const reactivateResponse = await request(app)
    .post(`/api/v1/trips/${tripId}/members/${previousOwnerMember._id}/reactivate`)
    .set(buildAuthHeader(collaborator.accessToken))

  assert.equal(reactivateResponse.statusCode, 200)
  assert.equal(reactivateResponse.body.data.member.isActive, true)
})

test('Organization flow: checklist + upload + reservation + expense + budget summary', async () => {
  const owner = await registerUser({
    name: 'Owner User',
    email: 'owner+org@example.com',
    password: 'Password123!',
  })

  const tripResponse = await request(app)
    .post('/api/v1/trips')
    .set(buildAuthHeader(owner.accessToken))
    .send({
      title: 'Goa Vacation',
      startDate: '2026-08-10T00:00:00.000Z',
      endDate: '2026-08-15T00:00:00.000Z',
      travelers: 2,
    })

  const tripId = tripResponse.body.data.trip._id

  const checklistResponse = await request(app)
    .post(`/api/v1/trips/${tripId}/checklists`)
    .set(buildAuthHeader(owner.accessToken))
    .send({
      title: 'Packing list',
      type: 'packing',
    })

  assert.equal(checklistResponse.statusCode, 201)
  const checklistId = checklistResponse.body.data.checklist._id

  const checklistItemResponse = await request(app)
    .post(`/api/v1/trips/${tripId}/checklists/${checklistId}/items`)
    .set(buildAuthHeader(owner.accessToken))
    .send({
      label: 'Passport',
    })

  assert.equal(checklistItemResponse.statusCode, 201)
  const itemId = checklistItemResponse.body.data.item._id

  const updateChecklistItemResponse = await request(app)
    .patch(`/api/v1/trips/${tripId}/checklists/${checklistId}/items/${itemId}`)
    .set(buildAuthHeader(owner.accessToken))
    .send({
      isCompleted: true,
    })

  assert.equal(updateChecklistItemResponse.statusCode, 200)
  assert.equal(updateChecklistItemResponse.body.data.item.isCompleted, true)

  const uploadAttachmentResponse = await request(app)
    .post(`/api/v1/trips/${tripId}/attachments/upload`)
    .set(buildAuthHeader(owner.accessToken))
    .field('targetType', 'trip')
    .attach('file', Buffer.from('mock ticket data'), {
      filename: 'ticket.pdf',
      contentType: 'application/pdf',
    })

  assert.equal(uploadAttachmentResponse.statusCode, 201)

  const reservationResponse = await request(app)
    .post(`/api/v1/trips/${tripId}/reservations`)
    .set(buildAuthHeader(owner.accessToken))
    .send({
      title: 'Hotel booking',
      reservationType: 'hotel',
      startDateTime: '2026-08-10T11:00:00.000Z',
      endDateTime: '2026-08-15T10:00:00.000Z',
      amount: 500,
    })

  assert.equal(reservationResponse.statusCode, 201)
  const reservationId = reservationResponse.body.data.reservation._id

  const expenseResponse = await request(app)
    .post(`/api/v1/trips/${tripId}/expenses`)
    .set(buildAuthHeader(owner.accessToken))
    .send({
      reservation: reservationId,
      title: 'Hotel payment',
      category: 'stay',
      amount: 500,
      splitType: 'none',
    })

  assert.equal(expenseResponse.statusCode, 201)

  const upsertBudgetResponse = await request(app)
    .put(`/api/v1/trips/${tripId}/budget`)
    .set(buildAuthHeader(owner.accessToken))
    .send({
      totalBudget: 1200,
      categoryLimits: [
        { category: 'stay', limit: 700 },
        { category: 'food', limit: 300 },
      ],
    })

  assert.equal(upsertBudgetResponse.statusCode, 200)
  assert.equal(upsertBudgetResponse.body.data.budget.totalBudget, 1200)

  const budgetSummaryResponse = await request(app)
    .get(`/api/v1/trips/${tripId}/budget/summary`)
    .set(buildAuthHeader(owner.accessToken))

  assert.equal(budgetSummaryResponse.statusCode, 200)
  assert.equal(budgetSummaryResponse.body.data.summary.spentTotal, 500)

  const overviewResponse = await request(app)
    .get(`/api/v1/trips/${tripId}/organization/overview`)
    .set(buildAuthHeader(owner.accessToken))

  assert.equal(overviewResponse.statusCode, 200)
  assert.equal(overviewResponse.body.data.checklists, 1)
  assert.equal(overviewResponse.body.data.attachments, 1)
  assert.equal(overviewResponse.body.data.reservations, 1)
})

test('Advanced reporting flow: exchange rates + analytics + settlement + snapshots', async () => {
  const owner = await registerUser({
    name: 'Owner Reports',
    email: 'owner+reports@example.com',
    password: 'Password123!',
  })

  const member = await registerUser({
    name: 'Member Reports',
    email: 'member+reports@example.com',
    password: 'Password123!',
  })

  const tripResponse = await request(app)
    .post('/api/v1/trips')
    .set(buildAuthHeader(owner.accessToken))
    .send({
      title: 'Reports Trip',
      startDate: '2026-09-01T00:00:00.000Z',
      endDate: '2026-09-05T00:00:00.000Z',
      travelers: 2,
      settings: {
        currency: 'USD',
      },
    })

  assert.equal(tripResponse.statusCode, 201)
  const tripId = tripResponse.body.data.trip._id

  const inviteResponse = await request(app)
    .post(`/api/v1/trips/${tripId}/invitations`)
    .set(buildAuthHeader(owner.accessToken))
    .send({
      email: member.user.email,
      role: 'EDITOR',
    })

  assert.equal(inviteResponse.statusCode, 201)

  const acceptResponse = await request(app)
    .post('/api/v1/invitations/accept')
    .set(buildAuthHeader(member.accessToken))
    .send({
      token: inviteResponse.body.data.inviteToken,
    })

  assert.equal(acceptResponse.statusCode, 200)

  const upsertRateResponse = await request(app)
    .put(`/api/v1/trips/${tripId}/exchange-rates`)
    .set(buildAuthHeader(owner.accessToken))
    .send({
      baseCurrency: 'EUR',
      quoteCurrency: 'USD',
      rate: 1.1,
      source: 'manual',
    })

  assert.equal(upsertRateResponse.statusCode, 200)
  assert.equal(upsertRateResponse.body.data.exchangeRate.rate, 1.1)

  const listRatesResponse = await request(app)
    .get(`/api/v1/trips/${tripId}/exchange-rates`)
    .set(buildAuthHeader(owner.accessToken))

  assert.equal(listRatesResponse.statusCode, 200)
  assert.equal(listRatesResponse.body.data.exchangeRates.length, 1)

  const convertPreviewResponse = await request(app)
    .post(`/api/v1/trips/${tripId}/currency/convert`)
    .set(buildAuthHeader(owner.accessToken))
    .send({
      amount: 50,
      fromCurrency: 'EUR',
      toCurrency: 'USD',
    })

  assert.equal(convertPreviewResponse.statusCode, 200)
  assert.equal(convertPreviewResponse.body.data.conversion.convertedAmount, 55)

  const expenseOne = await request(app)
    .post(`/api/v1/trips/${tripId}/expenses`)
    .set(buildAuthHeader(owner.accessToken))
    .send({
      title: 'Museum pass',
      category: 'activities',
      amount: 100,
      currency: 'EUR',
      splitType: 'equal',
    })

  assert.equal(expenseOne.statusCode, 201)
  assert.equal(expenseOne.body.data.expense.normalizedAmount, 110)

  const expenseTwo = await request(app)
    .post(`/api/v1/trips/${tripId}/expenses`)
    .set(buildAuthHeader(member.accessToken))
    .send({
      title: 'Cab fare',
      category: 'transport',
      amount: 40,
      currency: 'USD',
      splitType: 'equal',
    })

  assert.equal(expenseTwo.statusCode, 201)

  const analyticsResponse = await request(app)
    .get(`/api/v1/trips/${tripId}/analytics/expenses`)
    .query({
      granularity: 'day',
      periodDays: 30,
      forecastPeriods: 2,
    })
    .set(buildAuthHeader(owner.accessToken))

  assert.equal(analyticsResponse.statusCode, 200, JSON.stringify(analyticsResponse.body))
  assert.equal(analyticsResponse.body.data.analytics.totals.expenseCount, 2)
  assert.equal(analyticsResponse.body.data.analytics.forecast.length, 2)

  const settlementResponse = await request(app)
    .get(`/api/v1/trips/${tripId}/settlement`)
    .set(buildAuthHeader(owner.accessToken))

  assert.equal(settlementResponse.statusCode, 200)
  assert.equal(settlementResponse.body.data.settlement.settlements.length, 1)
  assert.equal(settlementResponse.body.data.settlement.settlements[0].amount, 35)

  const createSnapshotResponse = await request(app)
    .post(`/api/v1/trips/${tripId}/reports/snapshots`)
    .set(buildAuthHeader(owner.accessToken))
    .send({
      reportType: 'settlement',
      format: 'csv',
    })

  assert.equal(createSnapshotResponse.statusCode, 201)
  const snapshotId = createSnapshotResponse.body.data.snapshot._id

  const listSnapshotsResponse = await request(app)
    .get(`/api/v1/trips/${tripId}/reports/snapshots`)
    .set(buildAuthHeader(owner.accessToken))

  assert.equal(listSnapshotsResponse.statusCode, 200)
  assert.equal(listSnapshotsResponse.body.data.snapshots.length, 1)

  const getSnapshotResponse = await request(app)
    .get(`/api/v1/trips/${tripId}/reports/snapshots/${snapshotId}`)
    .set(buildAuthHeader(owner.accessToken))

  assert.equal(getSnapshotResponse.statusCode, 200)
  assert.equal(getSnapshotResponse.body.data.snapshot.reportType, 'settlement')

  const downloadSnapshotResponse = await request(app)
    .get(`/api/v1/trips/${tripId}/reports/snapshots/${snapshotId}`)
    .query({ download: true })
    .set(buildAuthHeader(owner.accessToken))

  assert.equal(downloadSnapshotResponse.statusCode, 200)
  assert.equal(downloadSnapshotResponse.headers['content-type'].includes('text/csv'), true)
})
