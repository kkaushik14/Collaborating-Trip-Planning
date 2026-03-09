import { Activity, ItineraryDay } from '../models/index.js'
import {
  ApiError,
  ApiResponse,
  asyncHandler,
  assertObjectId,
  parseDateOrThrow,
} from '../utils/index.js'

const createItineraryDay = asyncHandler(async (req, res) => {
  const { tripId } = req.params
  const { dayNumber, date, title, notes } = req.body

  if (!Number.isInteger(dayNumber) || dayNumber <= 0) {
    throw ApiError.badRequest('dayNumber must be a positive integer')
  }

  const parsedDate = parseDateOrThrow(date, 'date')

  if (parsedDate < req.trip.startDate || parsedDate > req.trip.endDate) {
    throw ApiError.badRequest('Day date must be inside trip start and end dates')
  }

  const day = await ItineraryDay.create({
    trip: tripId,
    dayNumber,
    date: parsedDate,
    title: title || '',
    notes: notes || '',
  })

  return res.status(201).json(new ApiResponse(201, { day }, 'Itinerary day created successfully'))
})

const listItineraryDays = asyncHandler(async (req, res) => {
  const { tripId } = req.params

  const days = await ItineraryDay.find({ trip: tripId }).sort({ dayNumber: 1 }).lean()
  const dayIds = days.map((day) => day._id)

  const activities =
    dayIds.length > 0
      ? await Activity.find({
          trip: tripId,
          day: { $in: dayIds },
        })
          .sort({ position: 1, startTime: 1, createdAt: 1 })
          .lean()
      : []

  const groupedActivities = new Map()

  for (const activity of activities) {
    const key = activity.day.toString()
    if (!groupedActivities.has(key)) {
      groupedActivities.set(key, [])
    }

    groupedActivities.get(key).push(activity)
  }

  const responseDays = days.map((day) => ({
    ...day,
    activities: groupedActivities.get(day._id.toString()) || [],
  }))

  return res
    .status(200)
    .json(new ApiResponse(200, { days: responseDays }, 'Itinerary days fetched successfully'))
})

const addActivityCard = asyncHandler(async (req, res) => {
  const { tripId, dayId } = req.params
  const {
    title,
    description,
    locationName,
    address,
    startTime,
    endTime,
    estimatedCost,
  } = req.body

  assertObjectId(dayId, 'dayId')

  if (!title || !title.trim()) {
    throw ApiError.badRequest('title is required')
  }

  const day = await ItineraryDay.findOne({ _id: dayId, trip: tripId })
  if (!day) {
    throw ApiError.notFound('Itinerary day not found for this trip')
  }

  const parsedStartTime = startTime ? parseDateOrThrow(startTime, 'startTime') : null
  const parsedEndTime = endTime ? parseDateOrThrow(endTime, 'endTime') : null

  if (parsedStartTime && parsedEndTime && parsedEndTime < parsedStartTime) {
    throw ApiError.badRequest('endTime must be greater than or equal to startTime')
  }

  const lastActivity = await Activity.findOne({ trip: tripId, day: dayId })
    .sort({ position: -1 })
    .select('position')
    .lean()

  const nextPosition = lastActivity ? lastActivity.position + 1 : 0

  const activity = await Activity.create({
    trip: tripId,
    day: dayId,
    title: title.trim(),
    description: description || '',
    locationName: locationName || '',
    address: address || '',
    startTime: parsedStartTime,
    endTime: parsedEndTime,
    position: nextPosition,
    estimatedCost: {
      amount: Number(estimatedCost?.amount || 0),
      currency: estimatedCost?.currency || req.trip.settings.currency || 'USD',
    },
    createdBy: req.actorId,
  })

  day.activityOrder.push(activity._id)
  await day.save()

  return res
    .status(201)
    .json(new ApiResponse(201, { activity }, 'Activity card added successfully'))
})

const listActivitiesForDay = asyncHandler(async (req, res) => {
  const { tripId, dayId } = req.params
  assertObjectId(dayId, 'dayId')

  const day = await ItineraryDay.findOne({ _id: dayId, trip: tripId }).lean()
  if (!day) {
    throw ApiError.notFound('Itinerary day not found for this trip')
  }

  const activities = await Activity.find({ trip: tripId, day: dayId })
    .sort({ position: 1, startTime: 1, createdAt: 1 })
    .lean()

  return res
    .status(200)
    .json(new ApiResponse(200, { day, activities }, 'Activities fetched successfully'))
})

const reorderActivities = asyncHandler(async (req, res) => {
  const { tripId, dayId } = req.params
  const { activityIds } = req.body

  assertObjectId(dayId, 'dayId')

  if (!Array.isArray(activityIds) || activityIds.length === 0) {
    throw ApiError.badRequest('activityIds must be a non-empty array')
  }

  for (const activityId of activityIds) {
    assertObjectId(activityId, 'activityId')
  }

  const uniqueIds = [...new Set(activityIds)]
  if (uniqueIds.length !== activityIds.length) {
    throw ApiError.badRequest('activityIds must not contain duplicates')
  }

  const day = await ItineraryDay.findOne({ _id: dayId, trip: tripId })
  if (!day) {
    throw ApiError.notFound('Itinerary day not found for this trip')
  }

  const currentActivities = await Activity.find({ trip: tripId, day: dayId })
    .select('_id')
    .lean()

  const existingIds = currentActivities.map((activity) => activity._id.toString()).sort()
  const incomingIds = [...activityIds].sort()

  if (
    existingIds.length !== incomingIds.length ||
    existingIds.some((value, index) => value !== incomingIds[index])
  ) {
    throw ApiError.badRequest('activityIds must exactly match existing activities for this day')
  }

  await Activity.bulkWrite(
    activityIds.map((activityId, index) => ({
      updateOne: {
        filter: { _id: activityId, day: dayId, trip: tripId },
        update: { $set: { position: index } },
      },
    })),
  )

  day.activityOrder = activityIds
  await day.save()

  const reorderedActivities = await Activity.find({ trip: tripId, day: dayId })
    .sort({ position: 1 })
    .lean()

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        day,
        activities: reorderedActivities,
      },
      'Activities reordered successfully',
    ),
  )
})

export {
  addActivityCard,
  createItineraryDay,
  listActivitiesForDay,
  listItineraryDays,
  reorderActivities,
}
