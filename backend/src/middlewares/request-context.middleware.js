import { Trip, TripMember, User } from '../models/index.js'
import { hasTripPermission, verifyAccessToken } from '../services/index.js'
import { ApiError, asyncHandler, assertObjectId } from '../utils/index.js'

const extractBearerToken = (authorizationHeader = '') => {
  const [scheme, token] = authorizationHeader.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return null
  }

  return token
}

const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractBearerToken(req.headers.authorization)

  if (!token) {
    throw ApiError.unauthorized('Authorization Bearer token is required')
  }

  let payload

  try {
    payload = verifyAccessToken(token)
  } catch (_error) {
    throw ApiError.unauthorized('Invalid or expired access token')
  }

  const user = await User.findById(payload.sub).select('_id name email isActive').lean()

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('User account is invalid or inactive')
  }

  req.user = user
  req.actorId = user._id.toString()

  next()
})

const requireActor = authenticate

const authorizeTripPermission = (permission) => {
  return asyncHandler(async (req, _res, next) => {
    const { tripId } = req.params
    assertObjectId(tripId, 'tripId')

    const trip = await Trip.findById(tripId)
    if (!trip) {
      throw ApiError.notFound('Trip not found')
    }

    let actorRole = null
    let membership = null

    if (trip.owner.toString() === req.actorId) {
      actorRole = 'OWNER'
    } else {
      membership = await TripMember.findOne({
        trip: tripId,
        user: req.actorId,
        isActive: true,
      })

      if (!membership) {
        throw ApiError.forbidden('You are not a member of this trip')
      }

      actorRole = membership.role
    }

    if (!hasTripPermission(actorRole, permission)) {
      throw ApiError.forbidden('Insufficient permissions for this action')
    }

    req.trip = trip
    req.actorRole = actorRole
    req.membership = membership

    next()
  })
}

export { authenticate, authorizeTripPermission, requireActor }
