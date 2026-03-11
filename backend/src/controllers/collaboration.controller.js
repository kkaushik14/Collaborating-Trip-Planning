import crypto from 'node:crypto'

import {
  Activity,
  COMMENT_TARGET_TYPES,
  Comment,
  INVITABLE_ROLES,
  ItineraryDay,
  Trip,
  TripInvitation,
  TripMember,
  TRIP_ROLES,
  User,
} from '../models/index.js'
import {
  queueCommentNotification,
  runInTransaction,
  sendInvitationEmail,
} from '../services/index.js'
import {
  ApiError,
  ApiResponse,
  DEFAULT_INVITE_EXPIRY_DAYS,
  asyncHandler,
  assertObjectId,
  parsePagination,
  resolveFrontendBaseUrl,
} from '../utils/index.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const normalizeCommentEmailOptIn = (value) => {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true' || normalized === 'false') {
      return normalized
    }
  }

  return 'true'
}

const inviteMember = asyncHandler(async (req, res) => {
  const { tripId } = req.params
  const { email, role = 'VIEWER', expiresInDays = DEFAULT_INVITE_EXPIRY_DAYS } = req.body

  if (!email || !emailPattern.test(email)) {
    throw ApiError.badRequest('A valid email is required')
  }

  if (!INVITABLE_ROLES.includes(role)) {
    throw ApiError.badRequest(`role must be one of: ${INVITABLE_ROLES.join(', ')}`)
  }

  if (!Number.isInteger(expiresInDays) || expiresInDays <= 0 || expiresInDays > 90) {
    throw ApiError.badRequest('expiresInDays must be a positive integer up to 90')
  }

  const normalizedEmail = email.toLowerCase().trim()

  const existingPendingInvite = await TripInvitation.findOne({
    trip: tripId,
    email: normalizedEmail,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  })

  if (existingPendingInvite) {
    throw ApiError.conflict('A pending invitation already exists for this email')
  }

  const inviteToken = crypto.randomBytes(24).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex')

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  const invitation = await TripInvitation.create({
    trip: tripId,
    email: normalizedEmail,
    role,
    invitedBy: req.actorId,
    tokenHash,
    expiresAt,
  })

  const frontendBaseUrl = resolveFrontendBaseUrl(req)
  const inviteUrl = `${frontendBaseUrl}/invitations/accept?token=${inviteToken}`

  await sendInvitationEmail({
    email: normalizedEmail,
    tripTitle: req.trip.title,
    role,
    inviteUrl,
    inviterName: req.user.name || req.user.email || 'Trip Owner',
  })

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        invitation,
        inviteToken,
        inviteUrl,
      },
      'Invitation created and email queued successfully',
    ),
  )
})

const listInvitations = asyncHandler(async (req, res) => {
  const { tripId } = req.params
  const invitations = await TripInvitation.find({ trip: tripId }).sort({ createdAt: -1 }).lean()

  return res
    .status(200)
    .json(new ApiResponse(200, { invitations }, 'Invitations fetched successfully'))
})

const listMyInvitations = asyncHandler(async (req, res) => {
  const invitations = await TripInvitation.find({
    email: req.user.email,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .lean()

  return res
    .status(200)
    .json(new ApiResponse(200, { invitations }, 'My invitations fetched successfully'))
})

const acceptInvitation = asyncHandler(async (req, res) => {
  const { token } = req.body

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const invitation = await TripInvitation.findOne({ tokenHash })

  if (!invitation) {
    throw ApiError.notFound('Invitation not found')
  }

  if (invitation.status !== 'pending') {
    throw ApiError.badRequest(`Invitation is ${invitation.status} and cannot be accepted`)
  }

  if (invitation.expiresAt < new Date()) {
    invitation.status = 'expired'
    invitation.respondedAt = new Date()
    await invitation.save()
    throw ApiError.badRequest('Invitation has expired')
  }

  if (invitation.email !== req.user.email) {
    throw ApiError.forbidden('Invitation email does not match authenticated user')
  }

  const result = await runInTransaction(async (session) => {
    const queryOptions = session ? { session } : {}

    let tripMember = await TripMember.findOne({
      trip: invitation.trip,
      user: req.actorId,
    }, null, queryOptions)

    if (!tripMember) {
      const memberPayload = {
        trip: invitation.trip,
        user: req.actorId,
        role: invitation.role,
        addedBy: invitation.invitedBy,
        isActive: true,
      }

      tripMember = session
        ? (await TripMember.create([memberPayload], queryOptions))[0]
        : await TripMember.create(memberPayload)
    } else {
      tripMember.role = invitation.role
      tripMember.isActive = true
      await tripMember.save(queryOptions)
    }

    invitation.status = 'accepted'
    invitation.respondedAt = new Date()
    await invitation.save(queryOptions)

    return {
      invitation,
      member: tripMember,
    }
  })

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      'Invitation accepted successfully',
    ),
  )
})

const listMembers = asyncHandler(async (req, res) => {
  const { tripId } = req.params

  const members = await TripMember.find({
    trip: tripId,
    isActive: true,
  })
    .sort({ createdAt: 1 })
    .lean()

  const normalizedMembers = members.map((member) => ({
    ...member,
    commentEmailOptIn: normalizeCommentEmailOptIn(member.commentEmailOptIn),
  }))

  return res.status(200).json(new ApiResponse(200, { members: normalizedMembers }, 'Members fetched successfully'))
})

const updateMyCommentEmailPreference = asyncHandler(async (req, res) => {
  const { tripId } = req.params
  const nextPreference = normalizeCommentEmailOptIn(req.body.commentEmailOptIn)

  const member = await TripMember.findOne({
    trip: tripId,
    user: req.actorId,
    isActive: true,
  })

  if (!member) {
    throw ApiError.notFound('Active trip membership not found')
  }

  member.commentEmailOptIn = nextPreference
  await member.save()

  return res.status(200).json(
    new ApiResponse(
      200,
      { member },
      `Comment email notifications ${nextPreference === 'true' ? 'enabled' : 'disabled'} successfully`,
    ),
  )
})

const updateMemberRole = asyncHandler(async (req, res) => {
  const { tripId, memberId } = req.params
  const { role } = req.body

  assertObjectId(memberId, 'memberId')

  if (!role || !TRIP_ROLES.includes(role)) {
    throw ApiError.badRequest(`role must be one of: ${TRIP_ROLES.join(', ')}`)
  }

  if (role === 'OWNER') {
    throw ApiError.badRequest('Use ownership transfer flow to assign OWNER role')
  }

  const member = await TripMember.findOne({
    _id: memberId,
    trip: tripId,
    isActive: true,
  })

  if (!member) {
    throw ApiError.notFound('Trip member not found')
  }

  if (member.role === 'OWNER') {
    throw ApiError.badRequest('Cannot directly modify OWNER role')
  }

  member.role = role
  await member.save()

  return res.status(200).json(new ApiResponse(200, { member }, 'Member role updated successfully'))
})

const deactivateMember = asyncHandler(async (req, res) => {
  const { tripId, memberId } = req.params

  assertObjectId(memberId, 'memberId')

  const member = await TripMember.findOne({ _id: memberId, trip: tripId, isActive: true })
  if (!member) {
    throw ApiError.notFound('Active member not found')
  }

  if (member.role === 'OWNER') {
    throw ApiError.badRequest('Use ownership transfer before removing current owner')
  }

  member.isActive = false
  await member.save()

  return res.status(200).json(new ApiResponse(200, { member }, 'Member deactivated successfully'))
})

const reactivateMember = asyncHandler(async (req, res) => {
  const { tripId, memberId } = req.params

  assertObjectId(memberId, 'memberId')

  const member = await TripMember.findOne({ _id: memberId, trip: tripId, isActive: false })
  if (!member) {
    throw ApiError.notFound('Inactive member not found')
  }

  member.isActive = true
  await member.save()

  return res.status(200).json(new ApiResponse(200, { member }, 'Member reactivated successfully'))
})

const transferOwnership = asyncHandler(async (req, res) => {
  const { tripId } = req.params
  const { newOwnerUserId } = req.body

  assertObjectId(newOwnerUserId, 'newOwnerUserId')

  if (req.actorRole !== 'OWNER') {
    throw ApiError.forbidden('Only current owner can transfer ownership')
  }

  if (req.actorId === newOwnerUserId) {
    throw ApiError.badRequest('newOwnerUserId must be different from current owner')
  }

  const targetUser = await User.findById(newOwnerUserId).select('_id isActive').lean()
  if (!targetUser || !targetUser.isActive) {
    throw ApiError.notFound('Target user not found or inactive')
  }

  const targetMember = await TripMember.findOne({
    trip: tripId,
    user: newOwnerUserId,
    isActive: true,
  })

  if (!targetMember) {
    throw ApiError.badRequest('Target user must be an active trip member before transfer')
  }

  const result = await runInTransaction(async (session) => {
    const queryOptions = session ? { session } : {}

    const currentOwnerMember = await TripMember.findOne({
      trip: tripId,
      user: req.actorId,
      isActive: true,
    }, null, queryOptions)

    if (!currentOwnerMember) {
      throw ApiError.notFound('Current owner membership not found')
    }

    currentOwnerMember.role = 'EDITOR'
    await currentOwnerMember.save(queryOptions)

    const newOwnerMember = await TripMember.findOne({
      _id: targetMember._id,
      trip: tripId,
      isActive: true,
    }, null, queryOptions)

    newOwnerMember.role = 'OWNER'
    await newOwnerMember.save(queryOptions)

    const trip = await Trip.findById(tripId, null, queryOptions)
    trip.owner = newOwnerUserId
    await trip.save(queryOptions)

    return {
      trip,
      previousOwnerMember: currentOwnerMember,
      newOwnerMember,
    }
  })

  return res.status(200).json(new ApiResponse(200, result, 'Ownership transferred successfully'))
})

const createComment = asyncHandler(async (req, res) => {
  const { tripId } = req.params
  const {
    targetType,
    dayId,
    day,
    activityId,
    activity,
    body,
    parentComment,
    parentCommentId,
    mentions = [],
  } = req.body
  const resolvedDayId = dayId || day || null
  const resolvedActivityId = activityId || activity || null
  const resolvedParentCommentId = parentComment || parentCommentId || null

  if (!targetType || !COMMENT_TARGET_TYPES.includes(targetType)) {
    throw ApiError.badRequest(`targetType must be one of: ${COMMENT_TARGET_TYPES.join(', ')}`)
  }

  if (!body || !body.trim()) {
    throw ApiError.badRequest('body is required')
  }

  if (targetType === 'day') {
    if (!resolvedDayId) {
      throw ApiError.badRequest('dayId is required when targetType is day')
    }

    assertObjectId(resolvedDayId, 'dayId')
    const dayRecord = await ItineraryDay.findOne({ _id: resolvedDayId, trip: tripId }).select('_id')
    if (!dayRecord) {
      throw ApiError.notFound('Day not found for this trip')
    }
  }

  if (targetType === 'activity') {
    if (!resolvedActivityId) {
      throw ApiError.badRequest('activityId is required when targetType is activity')
    }

    assertObjectId(resolvedActivityId, 'activityId')
    const activityRecord = await Activity.findOne({
      _id: resolvedActivityId,
      trip: tripId,
    }).select('_id')
    if (!activityRecord) {
      throw ApiError.notFound('Activity not found for this trip')
    }
  }

  if (resolvedParentCommentId) {
    assertObjectId(resolvedParentCommentId, 'parentComment')
    const parent = await Comment.findOne({ _id: resolvedParentCommentId, trip: tripId }).select('_id')
    if (!parent) {
      throw ApiError.notFound('Parent comment not found')
    }
  }

  for (const mentionId of mentions) {
    assertObjectId(mentionId, 'mention user id')
  }

  const comment = await Comment.create({
    trip: tripId,
    author: req.actorId,
    targetType,
    day: targetType === 'day' ? resolvedDayId : null,
    activity: targetType === 'activity' ? resolvedActivityId : null,
    body: body.trim(),
    parentComment: resolvedParentCommentId,
    mentions,
  })

  queueCommentNotification({
    tripId,
    targetType,
    dayId: targetType === 'day' ? resolvedDayId : null,
    activityId: targetType === 'activity' ? resolvedActivityId : null,
    commentId: comment._id,
  })

  return res.status(201).json(new ApiResponse(201, { comment }, 'Comment created successfully'))
})

const listComments = asyncHandler(async (req, res) => {
  const { tripId } = req.params
  const {
    targetType,
    dayId,
    day,
    activityId,
    activity,
  } = req.query
  const { page, limit, skip } = parsePagination(req.query)
  const resolvedDayId = dayId || day
  const resolvedActivityId = activityId || activity

  const filters = { trip: tripId }

  if (targetType) {
    if (!COMMENT_TARGET_TYPES.includes(targetType)) {
      throw ApiError.badRequest(`targetType must be one of: ${COMMENT_TARGET_TYPES.join(', ')}`)
    }

    filters.targetType = targetType

    if (targetType === 'day') {
      if (!resolvedDayId) {
        throw ApiError.badRequest('dayId is required when targetType is day')
      }

      assertObjectId(resolvedDayId, 'dayId')
      filters.day = resolvedDayId
    }

    if (targetType === 'activity') {
      if (!resolvedActivityId) {
        throw ApiError.badRequest('activityId is required when targetType is activity')
      }

      assertObjectId(resolvedActivityId, 'activityId')
      filters.activity = resolvedActivityId
    }
  }

  const [comments, total] = await Promise.all([
    Comment.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Comment.countDocuments(filters),
  ])

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comments,
      },
      'Comments fetched successfully',
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    ),
  )
})

export {
  acceptInvitation,
  createComment,
  deactivateMember,
  inviteMember,
  listComments,
  listInvitations,
  listMembers,
  listMyInvitations,
  reactivateMember,
  transferOwnership,
  updateMyCommentEmailPreference,
  updateMemberRole,
}
