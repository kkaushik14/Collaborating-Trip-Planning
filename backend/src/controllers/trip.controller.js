import {
  Trip,
  TripBudget,
  TripMember,
  TRIP_STATUS,
  TRIP_VISIBILITY,
} from '../models/index.js'
import {
  ApiError,
  ApiResponse,
  asyncHandler,
  parseDateOrThrow,
  resolveFrontendBaseUrl,
} from '../utils/index.js'
import { runInTransaction, sendTripCreatedEmail } from '../services/index.js'

const normalizeTravelerCount = (travelerCount, travelers) => {
  if (Array.isArray(travelers)) {
    return travelers.length || 1
  }

  if (typeof travelers === 'number') {
    return travelers
  }

  if (typeof travelerCount === 'number') {
    return travelerCount
  }

  return 1
}

const createTrip = asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, travelerCount, travelers, settings } = req.body

  if (!title || !title.trim()) {
    throw ApiError.badRequest('title is required')
  }

  if (!startDate || !endDate) {
    throw ApiError.badRequest('startDate and endDate are required')
  }

  const parsedStartDate = parseDateOrThrow(startDate, 'startDate')
  const parsedEndDate = parseDateOrThrow(endDate, 'endDate')

  if (parsedEndDate < parsedStartDate) {
    throw ApiError.badRequest('endDate must be greater than or equal to startDate')
  }

  const resolvedTravelerCount = Number(normalizeTravelerCount(travelerCount, travelers))

  if (!Number.isInteger(resolvedTravelerCount) || resolvedTravelerCount <= 0) {
    throw ApiError.badRequest('travelerCount must be a positive integer')
  }

  const trip = await runInTransaction(async (session) => {
    const tripPayload = {
      title: title.trim(),
      description: description || '',
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      travelerCount: resolvedTravelerCount,
      owner: req.actorId,
      settings: {
        currency: settings?.currency || 'USD',
        timezone: settings?.timezone || 'UTC',
      },
    }

    const createdTrip = session
      ? (await Trip.create([tripPayload], { session }))[0]
      : await Trip.create(tripPayload)

    const tripMemberPayload = {
      trip: createdTrip._id,
      user: req.actorId,
      role: 'OWNER',
      addedBy: req.actorId,
      isActive: true,
    }

    if (session) {
      await TripMember.create([tripMemberPayload], { session })
      await TripBudget.create(
        [
          {
            trip: createdTrip._id,
            currency: createdTrip.settings.currency,
          },
        ],
        { session },
      )
    } else {
      await TripMember.create(tripMemberPayload)
      await TripBudget.create({
        trip: createdTrip._id,
        currency: createdTrip.settings.currency,
      })
    }

    return createdTrip
  })

  void sendTripCreatedEmail({
    email: req.user.email,
    recipientName: req.user.name || 'Traveler',
    tripTitle: trip.title,
    startDate: trip.startDate,
    endDate: trip.endDate,
    tripUrl: `${resolveFrontendBaseUrl(req)}/trips/${trip._id}/planning`,
  }).catch((error) => {
    console.error('Failed to send trip creation email:', error)
  })

  return res
    .status(201)
    .json(new ApiResponse(201, { trip }, 'Trip created successfully'))
})

const listTrips = asyncHandler(async (req, res) => {
  const memberships = await TripMember.find({
    user: req.actorId,
    isActive: true,
  })
    .select('trip role')
    .lean()

  const memberTripIds = memberships.map((membership) => membership.trip)

  const trips = await Trip.find({
    $or: [{ owner: req.actorId }, { _id: { $in: memberTripIds } }],
  })
    .sort({ startDate: 1, createdAt: -1 })
    .lean()

  const roleByTripId = new Map(
    memberships.map((membership) => [membership.trip.toString(), membership.role]),
  )

  const data = trips.map((trip) => ({
    ...trip,
    actorRole:
      trip.owner.toString() === req.actorId ? 'OWNER' : roleByTripId.get(trip._id.toString()),
  }))

  return res.status(200).json(new ApiResponse(200, { trips: data }, 'Trips fetched successfully'))
})

const getTripById = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        trip: req.trip,
        actorRole: req.actorRole,
      },
      'Trip fetched successfully',
    ),
  )
})

const updateTrip = asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, travelerCount, travelers, status, visibility } =
    req.body

  const hasUpdates =
    title !== undefined ||
    description !== undefined ||
    startDate !== undefined ||
    endDate !== undefined ||
    travelerCount !== undefined ||
    travelers !== undefined ||
    status !== undefined ||
    visibility !== undefined ||
    req.body.settings !== undefined

  if (!hasUpdates) {
    throw ApiError.badRequest('At least one field is required to update trip')
  }

  if (title !== undefined) {
    if (!title || !title.trim()) {
      throw ApiError.badRequest('title cannot be empty')
    }

    req.trip.title = title.trim()
  }

  if (description !== undefined) {
    req.trip.description = description || ''
  }

  let nextStartDate = req.trip.startDate
  let nextEndDate = req.trip.endDate

  if (startDate !== undefined) {
    nextStartDate = parseDateOrThrow(startDate, 'startDate')
  }

  if (endDate !== undefined) {
    nextEndDate = parseDateOrThrow(endDate, 'endDate')
  }

  if (nextEndDate < nextStartDate) {
    throw ApiError.badRequest('endDate must be greater than or equal to startDate')
  }

  req.trip.startDate = nextStartDate
  req.trip.endDate = nextEndDate

  if (travelerCount !== undefined || travelers !== undefined) {
    const resolvedTravelerCount = Number(normalizeTravelerCount(travelerCount, travelers))

    if (!Number.isInteger(resolvedTravelerCount) || resolvedTravelerCount <= 0) {
      throw ApiError.badRequest('travelerCount must be a positive integer')
    }

    req.trip.travelerCount = resolvedTravelerCount
  }

  if (status !== undefined) {
    if (!TRIP_STATUS.includes(status)) {
      throw ApiError.badRequest(`status must be one of: ${TRIP_STATUS.join(', ')}`)
    }

    req.trip.status = status
  }

  if (visibility !== undefined) {
    if (!TRIP_VISIBILITY.includes(visibility)) {
      throw ApiError.badRequest(`visibility must be one of: ${TRIP_VISIBILITY.join(', ')}`)
    }

    req.trip.visibility = visibility
  }

  if (req.body.settings !== undefined) {
    const { currency, timezone } = req.body.settings || {}

    if (currency !== undefined) {
      req.trip.settings.currency = currency
    }

    if (timezone !== undefined) {
      req.trip.settings.timezone = timezone
    }
  }

  await req.trip.save()

  return res
    .status(200)
    .json(new ApiResponse(200, { trip: req.trip }, 'Trip updated successfully'))
})

export { createTrip, getTripById, listTrips, updateTrip }
