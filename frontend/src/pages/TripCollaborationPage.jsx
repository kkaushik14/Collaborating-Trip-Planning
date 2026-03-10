import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'

import { CollaborationPanel } from '../components/features/index.js'
import {
  useCreateTripComment,
  useCreateTripInvitation,
  useCreateTripMemberReactivation,
  useDeleteTripMember,
  useItineraryDays,
  useTripComments,
  useTripInvitations,
  useTripMembers,
  useUpdateTripMemberRole,
} from '../hooks/index.js'
import {
  PageErrorState,
  PageLoadingState,
} from './PageStates.jsx'
import { fallbackMemberName, formatDateLabel } from './tripPageUtils.js'

const getPrimaryError = (...errors) => errors.find(Boolean) || null

const TripCollaborationPage = () => {
  const { tripId } = useOutletContext()

  const membersQuery = useTripMembers({ tripId })
  const invitationsQuery = useTripInvitations({ tripId })
  const commentsQuery = useTripComments({ tripId })
  const itineraryDaysQuery = useItineraryDays({ tripId })

  const createInvitationMutation = useCreateTripInvitation()
  const updateMemberRoleMutation = useUpdateTripMemberRole()
  const deactivateMemberMutation = useDeleteTripMember()
  const reactivateMemberMutation = useCreateTripMemberReactivation()
  const createCommentMutation = useCreateTripComment()

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

      const name =
        (typeof rawUser === 'object' ? rawUser?.name || rawUser?.displayName : '') ||
        fallbackMemberName(id)
      const email = typeof rawUser === 'object' ? rawUser?.email || 'Email unavailable' : 'Email unavailable'

      map.set(id, { id, name, email })
    }

    return map
  }, [membersQuery.data?.members])

  const mappedMembers = useMemo(() => {
    const members = membersQuery.data?.members || []

    return members.map((member) => {
      const rawUser = member.user
      const userId = typeof rawUser === 'object' ? rawUser?._id : rawUser
      const knownUser = memberMap.get(userId)

      return {
        id: member._id,
        name: knownUser?.name || fallbackMemberName(userId),
        email: knownUser?.email || 'Email unavailable',
        role: member.role || 'VIEWER',
        isActive: Boolean(member.isActive),
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

    return comments.map((comment) => {
      const author = memberMap.get(comment.author)
      const targetLabel =
        comment.targetType === 'activity'
          ? `Activity ${comment.activity ? String(comment.activity).slice(-4) : ''}`
          : `Day ${comment.day ? String(comment.day).slice(-4) : ''}`

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
  }, [commentsQuery.data?.comments, memberMap])

  const defaultDayId = itineraryDaysQuery.data?.days?.[0]?._id

  if (isLoading) {
    return (
      <PageLoadingState
        title="Loading collaboration..."
        description="Fetching members, invitations, and comments."
      />
    )
  }

  if (combinedError) {
    return (
      <PageErrorState
        title="Unable to load collaboration data"
        description="Collaboration endpoints returned an error."
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
          description="The comment API request failed."
          errorMessage={createCommentMutation.error?.message}
          onRetry={() => createCommentMutation.reset()}
        />
      ) : null}

      <CollaborationPanel
        members={mappedMembers}
        invitations={mappedInvitations}
        comments={mappedComments}
        onInviteSubmit={(payload) =>
          createInvitationMutation.mutate({
            tripId,
            body: payload,
          })
        }
        onMemberRoleChange={(memberId, role) =>
          updateMemberRoleMutation.mutate({
            tripId,
            memberId,
            body: { role },
          })
        }
        onMemberActiveToggle={(memberId, nextActive) => {
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
        onCommentSubmit={(body) =>
          createCommentMutation.mutate({
            tripId,
            body: {
              body,
              targetType: 'day',
              day: defaultDayId,
            },
          })
        }
      />
    </div>
  )
}

export default TripCollaborationPage
