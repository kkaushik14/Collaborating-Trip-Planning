import {
  Activity,
  Comment,
  ItineraryDay,
  Trip,
  TripMember,
} from '../models/index.js'
import { env } from '../config/index.js'
import { sendCommentUpdateEmail } from './mail.service.js'

const COMMENT_NOTIFICATION_DELAY_MS = 3000
const pendingCommentNotificationJobs = new Map()

const toObjectIdString = (value) => {
  if (!value) {
    return ''
  }

  return String(value)
}

const normalizeCommentPreference = (value) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true' || normalized === 'false') {
      return normalized
    }
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  return 'true'
}

const buildTargetKey = ({ tripId, targetType, dayId, activityId }) => {
  const scopedTargetId =
    targetType === 'activity'
      ? toObjectIdString(activityId)
      : toObjectIdString(dayId)

  return `${toObjectIdString(tripId)}:${targetType}:${scopedTargetId || 'trip'}`
}

const buildCommentUrl = (tripId) =>
  `${env.frontendBaseUrl.replace(/\/$/, '')}/trips/${tripId}/collaboration`

const buildCommentOptOutUrl = (tripId) =>
  `${buildCommentUrl(tripId)}?commentEmailPref=optout`

const resolveTargetLabel = async ({ tripId, targetType, dayId, activityId }) => {
  if (targetType === 'day' && dayId) {
    const day = await ItineraryDay.findOne({ _id: dayId, trip: tripId }).select('dayNumber title').lean()
    if (day) {
      return `Day ${day.dayNumber}${day.title ? ` - ${day.title}` : ''}`
    }
  }

  if (targetType === 'activity' && activityId) {
    const activity = await Activity.findOne({ _id: activityId, trip: tripId }).select('title').lean()
    if (activity) {
      return activity.title || 'Activity'
    }
  }

  return 'Trip thread'
}

const flushCommentNotificationJob = async ({ key, sequence }) => {
  const currentJob = pendingCommentNotificationJobs.get(key)
  if (!currentJob || currentJob.sequence !== sequence) {
    return
  }

  pendingCommentNotificationJobs.delete(key)

  try {
    const commentIds = Array.from(currentJob.commentIds)
    const [trip, comments, members, targetLabel] = await Promise.all([
      Trip.findById(currentJob.tripId).select('_id title').lean(),
      Comment.find({ _id: { $in: commentIds }, trip: currentJob.tripId })
        .sort({ createdAt: -1 })
        .select('_id body author createdAt')
        .lean(),
      TripMember.find({
        trip: currentJob.tripId,
        isActive: true,
      })
        .populate({
          path: 'user',
          select: '_id name email isActive',
        })
        .select('user commentEmailOptIn')
        .lean(),
      resolveTargetLabel({
        tripId: currentJob.tripId,
        targetType: currentJob.targetType,
        dayId: currentJob.dayId,
        activityId: currentJob.activityId,
      }),
    ])

    if (!trip || !comments.length) {
      return
    }

    const latestComment = comments[0]
    const actorId = toObjectIdString(latestComment.author)
    const actorMember = members.find(
      (member) => toObjectIdString(member.user?._id) === actorId,
    )
    const actorName = actorMember?.user?.name || 'A collaborator'
    const recipientMembers = members.filter((member) => {
      const userId = toObjectIdString(member.user?._id)
      // Notifications are controlled by each recipient's own preference.
      const isRecipientOptedIn = normalizeCommentPreference(member.commentEmailOptIn) === 'true'
      const hasValidEmail = Boolean(member.user?.email && member.user?.isActive)
      return isRecipientOptedIn && hasValidEmail && userId !== actorId
    })

    if (!recipientMembers.length) {
      return
    }

    const commentUrl = buildCommentUrl(currentJob.tripId)
    const optOutUrl = buildCommentOptOutUrl(currentJob.tripId)
    const sanitizedComment = String(latestComment.body || '').trim().slice(0, 240)
    const commentSummary = comments.length > 1
      ? `${sanitizedComment} (+${comments.length - 1} more recent update${comments.length - 1 > 1 ? 's' : ''})`
      : sanitizedComment

    await Promise.all(
      recipientMembers.map((member) =>
        sendCommentUpdateEmail({
          email: member.user.email,
          recipientName: member.user.name || 'Traveler',
          tripTitle: trip.title || 'Your Trip',
          actorName,
          commentBody: `${targetLabel}: ${commentSummary}`,
          commentUrl,
          optOutUrl,
        }),
      ),
    )
  } catch (error) {
    console.error('Failed to flush comment notification job:', error)
  }
}

const queueCommentNotification = ({ tripId, targetType, dayId, activityId, commentId }) => {
  const key = buildTargetKey({
    tripId,
    targetType,
    dayId,
    activityId,
  })

  const existingJob = pendingCommentNotificationJobs.get(key)
  const nextSequence = (existingJob?.sequence || 0) + 1

  if (existingJob?.timeout) {
    clearTimeout(existingJob.timeout)
  }

  const commentIds = existingJob?.commentIds || new Set()
  if (commentId) {
    commentIds.add(toObjectIdString(commentId))
  }

  const timeout = setTimeout(() => {
    void flushCommentNotificationJob({ key, sequence: nextSequence })
  }, COMMENT_NOTIFICATION_DELAY_MS)

  pendingCommentNotificationJobs.set(key, {
    sequence: nextSequence,
    timeout,
    commentIds,
    tripId: toObjectIdString(tripId),
    targetType,
    dayId: toObjectIdString(dayId),
    activityId: toObjectIdString(activityId),
  })
}

export {
  COMMENT_NOTIFICATION_DELAY_MS,
  queueCommentNotification,
}
