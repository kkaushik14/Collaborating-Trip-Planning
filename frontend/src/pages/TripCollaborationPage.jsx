import { useCallback, useMemo } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'

import { useAuth } from '../app/AuthProvider/index.js'
import { CollaborationPanel } from '../components/features/index.js'
import {
  useCreateTripComment,
  useCreateTripInvitation,
  useCreateTripMemberReactivation,
  useCreateTripOwnershipTransfer,
  useDeleteTripMember,
  useItineraryDays,
  useTripComments,
  useTripInvitations,
  useTripMembers,
  useUpdateMyTripCommentEmailPreference,
  useUpdateTripMemberRole,
} from '../hooks/index.js'
import { Button } from '../components/ui/index.js'
import {
  PageErrorState,
  PageLoadingState,
} from './PageStates.jsx'
import {
  canEditTripContent,
  canManageTripCollaboration,
  fallbackMemberName,
  formatDateLabel,
  normalizeActorRole,
} from './tripPageUtils.js'

const getPrimaryError = (...errors) => errors.find(Boolean) || null

const TripCollaborationPage = () => {
  const { tripId, trip } = useOutletContext()
  const { currentUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const membersQuery = useTripMembers({ tripId })
  const invitationsQuery = useTripInvitations({ tripId })
  const commentsQuery = useTripComments({ tripId })
  const itineraryDaysQuery = useItineraryDays({ tripId })

  const createInvitationMutation = useCreateTripInvitation()
  const updateMemberRoleMutation = useUpdateTripMemberRole()
  const deactivateMemberMutation = useDeleteTripMember()
  const reactivateMemberMutation = useCreateTripMemberReactivation()
  const transferOwnershipMutation = useCreateTripOwnershipTransfer()
  const updateMyCommentEmailPreferenceMutation = useUpdateMyTripCommentEmailPreference()
  const createCommentMutation = useCreateTripComment()
  const actorRole = normalizeActorRole(trip?.actorRole)
  const canManageMembers = canManageTripCollaboration(actorRole)
  const canInviteMembers = canEditTripContent(actorRole)

  const isLoading =
    membersQuery.isPending ||
    invitationsQuery.isPending ||
    commentsQuery.isPending ||
    itineraryDaysQuery.isPending

  const combinedError = getPrimaryError(
    membersQuery.error,
    invitationsQuery.error,
    commentsQuery.error,
    itineraryDaysQuery.error,
  )

  const memberMap = useMemo(() => {
    const map = new Map()
    const members = membersQuery.data?.members || []

    for (const member of members) {
      const rawUser = member.user
      const id = typeof rawUser === 'object' ? rawUser?._id : rawUser
      if (!id) {
        continue
      }

      const normalizedUserId = String(id)

      const name =
        (typeof rawUser === 'object' ? rawUser?.name || rawUser?.displayName : '') ||
        fallbackMemberName(normalizedUserId)
      const email = typeof rawUser === 'object' ? rawUser?.email || 'Email unavailable' : 'Email unavailable'

      map.set(normalizedUserId, { id: normalizedUserId, name, email })
    }

    return map
  }, [membersQuery.data?.members])

  const mappedMembers = useMemo(() => {
    const members = membersQuery.data?.members || []

    return members.map((member) => {
      const rawUser = member.user
      const userIdRaw = typeof rawUser === 'object' ? rawUser?._id : rawUser
      const userId = userIdRaw ? String(userIdRaw) : ''
      const knownUser = memberMap.get(userId)

      return {
        id: member._id,
        userId,
        name: knownUser?.name || fallbackMemberName(userId),
        email: knownUser?.email || 'Email unavailable',
        role: member.role || 'VIEWER',
        isActive: Boolean(member.isActive),
        commentEmailOptIn: String(member.commentEmailOptIn || 'true').toLowerCase() === 'false' ? 'false' : 'true',
      }
    })
  }, [memberMap, membersQuery.data?.members])

  const mappedInvitations = useMemo(() => {
    const invitations = invitationsQuery.data?.invitations || []

    return invitations.map((invitation) => ({
      id: invitation._id,
      email: invitation.email || 'unknown@example.com',
      role: invitation.role || 'VIEWER',
      status: String(invitation.status || 'pending').toUpperCase(),
      expiresAtLabel: formatDateLabel(invitation.expiresAt),
    }))
  }, [invitationsQuery.data?.invitations])

  const mappedComments = useMemo(() => {
    const comments = commentsQuery.data?.comments || []
    const dayLookup = new Map(
      (itineraryDaysQuery.data?.days || []).map((day) => [
        day._id,
        `Day ${Number(day.dayNumber || 0)}${day.title ? ` - ${day.title}` : ''}`,
      ]),
    )
    const activityLookup = new Map(
      (itineraryDaysQuery.data?.days || [])
        .flatMap((day) => day.activities || [])
        .map((activity) => [activity._id, activity.title || 'Activity']),
    )

    return comments.map((comment) => {
      const author = memberMap.get(comment.author)
      const targetLabel =
        comment.targetType === 'activity'
          ? activityLookup.get(comment.activity) || `Activity ${comment.activity ? String(comment.activity).slice(-4) : ''}`
          : dayLookup.get(comment.day) || `Day ${comment.day ? String(comment.day).slice(-4) : ''}`

      return {
        id: comment._id,
        authorName: author?.name || fallbackMemberName(comment.author),
        body: comment.body || '',
        targetLabel,
        createdAtLabel: formatDateLabel(comment.createdAt, {
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
    })
  }, [commentsQuery.data?.comments, itineraryDaysQuery.data?.days, memberMap])

  const dayTargets = useMemo(
    () =>
      (itineraryDaysQuery.data?.days || []).map((day) => ({
        id: day._id,
        label: `Day ${Number(day.dayNumber || 0)} - ${day.title || 'Untitled Day'}`,
      })),
    [itineraryDaysQuery.data?.days],
  )

  const activityTargets = useMemo(
    () =>
      (itineraryDaysQuery.data?.days || []).flatMap((day) =>
        (day.activities || []).map((activity) => ({
          id: activity._id,
          dayId: day._id,
          label: `${day.title || `Day ${Number(day.dayNumber || 0)}`} · ${activity.title || 'Untitled Activity'}`,
        })),
      ),
    [itineraryDaysQuery.data?.days],
  )
  const canComment = dayTargets.length > 0 || activityTargets.length > 0
  const currentActorMember = useMemo(
    () =>
      mappedMembers.find(
        (member) => member.userId && String(member.userId) === String(currentUser?._id || ''),
      ),
    [currentUser?._id, mappedMembers],
  )
  const isCommentEmailOptIn = (currentActorMember?.commentEmailOptIn || 'true') === 'true'
  const shouldOpenOptOutPromptFromQuery = searchParams.get('commentEmailPref') === 'optout'

  const handleCommentEmailPreferenceChange = useCallback(
    (nextOptIn) =>
      updateMyCommentEmailPreferenceMutation.mutateAsync({
        tripId,
        body: {
          commentEmailOptIn: nextOptIn ? 'true' : 'false',
        },
      }),
    [tripId, updateMyCommentEmailPreferenceMutation],
  )

  const consumeOptOutQueryPrompt = useCallback(() => {
    if (searchParams.get('commentEmailPref') !== 'optout') {
      return
    }

    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('commentEmailPref')
    setSearchParams(nextSearchParams, { replace: true })
  }, [searchParams, setSearchParams])

  const activeMembersCount = mappedMembers.filter((member) => member.isActive).length
  const pendingInvitationsCount = mappedInvitations.filter((invitation) => invitation.status === 'PENDING').length
  const ownershipCandidates = mappedMembers.filter(
    (member) => member.isActive && member.role !== 'OWNER' && member.userId,
  )

  if (isLoading) {
    return (
      <PageLoadingState
        title="Loading collaboration..."
        description="Preparing members, invites, and comment threads."
      />
    )
  }

  if (combinedError) {
    return (
      <PageErrorState
        title="Unable to load collaboration data"
        description="We could not load collaboration details for this trip."
        errorMessage={combinedError?.message}
        onRetry={() =>
          Promise.all([
            membersQuery.refetch(),
            invitationsQuery.refetch(),
            commentsQuery.refetch(),
            itineraryDaysQuery.refetch(),
          ])
        }
      />
    )
  }

  return (
    <div className="space-y-md">
      <section className="grid gap-sm sm:grid-cols-3">
        <article className="rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Active Members</p>
          <p className="mt-2xs text-title font-semibold text-ink">{activeMembersCount}</p>
        </article>
        <article className="rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Pending Invites</p>
          <p className="mt-2xs text-title font-semibold text-ink">{pendingInvitationsCount}</p>
        </article>
        <article className="rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Comments</p>
          <p className="mt-2xs text-title font-semibold text-ink">{mappedComments.length}</p>
        </article>
      </section>

      <section className="rounded-xl border border-line bg-panel p-lg shadow-card">
        <h3 className="text-title-sm font-semibold text-ink">Transfer Ownership</h3>
        <p className="mt-xs text-body-sm text-ink-muted">
          Transfer ownership to another active member when trip leadership changes.
        </p>
        {!canManageMembers ? (
          <p className="mt-sm text-body-sm text-ink-muted">
            Your current role is {actorRole}. Only OWNER can transfer trip ownership.
          </p>
        ) : null}
        <div className="mt-md flex flex-wrap items-center gap-sm">
          <select
            className="h-10 min-w-[15rem] rounded-md border border-line bg-panel px-lg text-body-sm text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
            defaultValue=""
            id="ownership-candidate"
            disabled={!canManageMembers}
            onChange={(event) => {
              const userId = event.target.value
              if (!userId || !canManageMembers) {
                return
              }

              transferOwnershipMutation.mutate({
                tripId,
                body: {
                  newOwnerUserId: userId,
                },
              })
            }}
          >
            <option value="">Select member to transfer ownership</option>
            {ownershipCandidates.map((member) => (
              <option key={`${member.id}-${member.userId}`} value={member.userId}>
                {member.name} ({member.email})
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            disabled
            title="Choose member from dropdown to trigger transfer"
          >
            Transfer via Selection
          </Button>
        </div>
      </section>

      {createInvitationMutation.error ? (
        <PageErrorState
          title="Invitation request failed"
          description="Invite could not be created."
          errorMessage={createInvitationMutation.error?.message}
          onRetry={() => createInvitationMutation.reset()}
        />
      ) : null}

      {createCommentMutation.error ? (
        <PageErrorState
          title="Comment could not be posted"
          description="Your comment was not posted. Please try again."
          errorMessage={createCommentMutation.error?.message}
          onRetry={() => createCommentMutation.reset()}
        />
      ) : null}

      {updateMyCommentEmailPreferenceMutation.error ? (
        <PageErrorState
          title="Comment email preference update failed"
          description="We could not update your email preference for comment notifications."
          errorMessage={updateMyCommentEmailPreferenceMutation.error?.message}
          onRetry={() => updateMyCommentEmailPreferenceMutation.reset()}
        />
      ) : null}

      {transferOwnershipMutation.error ? (
        <PageErrorState
          title="Ownership transfer failed"
          description="We could not transfer ownership right now."
          errorMessage={transferOwnershipMutation.error?.message}
          onRetry={() => transferOwnershipMutation.reset()}
        />
      ) : null}

      <CollaborationPanel
        tripId={tripId}
        members={mappedMembers}
        invitations={mappedInvitations}
        comments={mappedComments}
        dayTargets={dayTargets}
        activityTargets={activityTargets}
        canManageMembers={canManageMembers}
        canInviteMembers={canInviteMembers}
        canComment={canComment}
        commentEmailOptIn={isCommentEmailOptIn}
        isCommentEmailPreferenceUpdating={updateMyCommentEmailPreferenceMutation.isPending}
        onCommentEmailPreferenceChange={handleCommentEmailPreferenceChange}
        shouldPromptOptOutFromQuery={shouldOpenOptOutPromptFromQuery}
        onOptOutQueryPromptConsumed={consumeOptOutQueryPrompt}
        onInviteSubmit={(payload) =>
          canInviteMembers
            ? createInvitationMutation.mutateAsync({
                tripId,
                body: payload,
              })
            : Promise.resolve(null)
        }
        onMemberRoleChange={(memberId, role) =>
          canManageMembers
            ? updateMemberRoleMutation.mutate({
                tripId,
                memberId,
                body: { role },
              })
            : null
        }
        onMemberActiveToggle={(memberId, nextActive) => {
          if (!canManageMembers) {
            return
          }

          if (nextActive) {
            reactivateMemberMutation.mutate({
              tripId,
              memberId,
            })
            return
          }

          deactivateMemberMutation.mutate({
            tripId,
            memberId,
          })
        }}
        onCommentSubmit={({ body, targetType, dayId, activityId }) => {
          const hasDayTarget = targetType === 'day' && Boolean(dayId)
          const hasActivityTarget = targetType === 'activity' && Boolean(activityId)

          if (!hasDayTarget && !hasActivityTarget) {
            return Promise.resolve(null)
          }

          return createCommentMutation.mutateAsync({
            tripId,
            body: {
              body,
              targetType,
              dayId: hasDayTarget ? dayId : undefined,
              activityId: hasActivityTarget ? activityId : undefined,
            },
          })
        }}
      />
    </div>
  )
}

export default TripCollaborationPage
