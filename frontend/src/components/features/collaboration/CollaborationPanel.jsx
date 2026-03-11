import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { BellRingIcon, MailPlusIcon, MoreHorizontalIcon, SendIcon, Users2Icon } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'

import {
  Form,
  FormMessage,
  RHFTextField,
  RHFTextareaField,
} from '@/components/forms/index.js'
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/index.js'
import { Heading, Text } from '@/components/typography/index.js'
import { commentSchema, inviteMemberSchema } from '@/validators/index.js'
import { cn } from '@/lib/utils'

const ROLE_OPTIONS = ['OWNER', 'EDITOR', 'VIEWER']

function getInitials(value) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() || '')
    .join('')
}

function CollaborationPanel({
  tripId = '',
  members = [],
  invitations = [],
  comments = [],
  dayTargets = [],
  activityTargets = [],
  onInviteSubmit,
  onMemberRoleChange,
  onMemberActiveToggle,
  onCommentSubmit,
  canManageMembers = true,
  canInviteMembers = true,
  canComment = true,
  commentEmailOptIn = true,
  isCommentEmailPreferenceUpdating = false,
  onCommentEmailPreferenceChange,
  shouldPromptOptOutFromQuery = false,
  onOptOutQueryPromptConsumed,
  className,
}) {
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteRole, setInviteRole] = useState('VIEWER')
  const [isCommentOptOutDialogOpen, setIsCommentOptOutDialogOpen] = useState(false)
  const defaultDayTargetId = dayTargets[0]?.id || ''
  const defaultActivityTargetId = activityTargets[0]?.id || ''
  const hasDayTargets = dayTargets.length > 0
  const hasActivityTargets = activityTargets.length > 0

  const inviteForm = useForm({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: '',
      role: 'VIEWER',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })
  const commentForm = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      body: '',
      targetType: hasDayTargets ? 'day' : 'activity',
      dayId: defaultDayTargetId || undefined,
      activityId: defaultActivityTargetId || undefined,
      parentCommentId: undefined,
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  const commentTargetType = useWatch({
    control: commentForm.control,
    name: 'targetType',
  })
  const selectedDayId = useWatch({
    control: commentForm.control,
    name: 'dayId',
  })
  const selectedActivityId = useWatch({
    control: commentForm.control,
    name: 'activityId',
  })

  const visibleMembers = members.filter((member) => member.isActive)
  const hiddenCount = Math.max(0, members.length - 3)
  const recentComments = useMemo(() => comments.slice(0, 8), [comments])
  const activityTargetOptions = useMemo(() => {
    if (commentTargetType === 'day') {
      return []
    }

    if (selectedDayId) {
      const filtered = activityTargets.filter((target) => target.dayId === selectedDayId)
      return filtered.length ? filtered : activityTargets
    }

    return activityTargets
  }, [activityTargets, commentTargetType, selectedDayId])
  const isQueryOptOutPromptOpen = Boolean(shouldPromptOptOutFromQuery && commentEmailOptIn)
  const isCommentEmailDialogOpen = isCommentOptOutDialogOpen || isQueryOptOutPromptOpen

  const handleInviteSubmit = async (values) => {
    if (!canInviteMembers) {
      return
    }

    try {
      await Promise.resolve(onInviteSubmit?.(values))
      inviteForm.reset({
        email: '',
        role: 'VIEWER',
      })
      setInviteRole('VIEWER')
      setIsInviteOpen(false)
    } catch {
      // Keep form data intact so user can retry/correct input.
    }
  }

  const handleCommentSubmit = async (values) => {
    if (!canComment) {
      return
    }

    try {
      await Promise.resolve(onCommentSubmit?.(values))
      commentForm.reset({
        body: '',
        targetType: values.targetType,
        dayId: values.dayId,
        activityId: values.activityId,
        parentCommentId: undefined,
      })
    } catch {
      // Keep form data intact so user can retry/correct input.
    }
  }

  const handleCommentEmailToggle = async () => {
    if (isCommentEmailPreferenceUpdating) {
      return
    }

    if (commentEmailOptIn) {
      setIsCommentOptOutDialogOpen(true)
      return
    }

    try {
      await Promise.resolve(onCommentEmailPreferenceChange?.(true))
    } catch {
      // Keep existing state if update fails.
    }
  }

  const handleCommentEmailOptOutConfirm = async () => {
    if (isCommentEmailPreferenceUpdating) {
      return
    }

    try {
      await Promise.resolve(onCommentEmailPreferenceChange?.(false))
      onOptOutQueryPromptConsumed?.()
      setIsCommentOptOutDialogOpen(false)
    } catch {
      // Keep dialog open on failure so user can retry.
    }
  }

  return (
    <section className={cn('space-y-lg', className)}>
      <header className="flex flex-wrap items-start justify-between gap-md">
        <div className="space-y-xs">
          <Heading level={2}>Collaboration Workspace</Heading>
          <Text tone="muted">
            Invite members, manage roles, and keep conversation anchored to trip context.
          </Text>
          {!canInviteMembers ? (
            <Text size="body-sm" tone="muted">
              Invitations are available for OWNER/EDITOR roles. Member role updates require OWNER.
            </Text>
          ) : null}
        </div>

        <Dialog
          open={isInviteOpen}
          onOpenChange={(nextOpen) => {
            setIsInviteOpen(nextOpen)

            if (!nextOpen) {
              inviteForm.reset({
                email: '',
                role: 'VIEWER',
              })
              setInviteRole('VIEWER')
            }
          }}
        >
          <DialogTrigger
            disabled={!canInviteMembers}
            render={<Button size="sm" className="w-full sm:w-auto" />}
          >
            <MailPlusIcon className="size-4" />
            Invite Member
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a collaborator</DialogTitle>
              <DialogDescription>
                Invite people to this trip and assign how they can contribute.
              </DialogDescription>
            </DialogHeader>

            <Form
              methods={inviteForm}
              onSubmit={handleInviteSubmit}
              persistKey={`trip:${tripId}:collaboration:invite-member`}
              className="space-y-md"
            >
              <RHFTextField
                name="email"
                label="Email"
                type="email"
                required
                placeholder="member@example.com"
              />

              <div className="space-y-xs">
                <Text size="body-sm" weight="medium">
                  Role
                </Text>

                <div className="flex flex-wrap gap-sm">
                  {ROLE_OPTIONS.map((role) => (
                    <Button
                      key={role}
                      type="button"
                      size="sm"
                      variant={inviteRole === role ? 'default' : 'outline'}
                      disabled={!canInviteMembers}
                      onClick={() => {
                        setInviteRole(role)
                        inviteForm.setValue('role', role, {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        })
                      }}
                    >
                      {role}
                    </Button>
                  ))}
                </div>

                {inviteForm.formState.errors.role?.message ? (
                  <FormMessage>{inviteForm.formState.errors.role.message}</FormMessage>
                ) : null}
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  size="sm"
                  disabled={inviteForm.formState.isSubmitting || !canInviteMembers}
                >
                  <SendIcon className="size-4" />
                  Create Invite
                </Button>
              </DialogFooter>
            </Form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-lg lg:grid-cols-2">
        <article className="space-y-md rounded-lg border border-line bg-panel p-lg shadow-card">
          <header className="flex items-center justify-between gap-sm">
            <Heading level={3} size="title-sm">
              Active Members
            </Heading>
            <span className="inline-flex items-center gap-xs rounded-full bg-panel-muted px-sm py-2xs text-caption text-ink-muted">
              <Users2Icon className="size-3.5" />
              {visibleMembers.length} online
            </span>
          </header>

          <AvatarGroup>
            {visibleMembers.slice(0, 3).map((member) => (
              <Avatar key={member.id} size="sm" title={member.name}>
                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
              </Avatar>
            ))}
            {hiddenCount > 0 ? <AvatarGroupCount>+{hiddenCount}</AvatarGroupCount> : null}
          </AvatarGroup>

          <ul className="space-y-sm">
            {members.map((member) => (
              <li key={member.id} className="flex flex-col gap-sm rounded-md border border-line bg-panel-muted p-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 sm:max-w-[60%]">
                  <Text weight="medium">{member.name}</Text>
                  <Text size="caption" tone="muted" className="truncate">
                    {member.email}
                  </Text>
                </div>

                <div className="flex w-full items-center gap-xs sm:w-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      disabled={!canManageMembers}
                      render={<Button size="sm" variant="outline" className="w-full sm:w-auto" />}
                    >
                      {member.role}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {ROLE_OPTIONS.map((role) => (
                        <DropdownMenuItem
                          key={role}
                          disabled={!canManageMembers}
                          onClick={() => onMemberRoleChange?.(member.id, role)}
                        >
                          {role}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0"
                    disabled={!canManageMembers}
                    onClick={() => onMemberActiveToggle?.(member.id, !member.isActive)}
                  >
                    <MoreHorizontalIcon className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="space-y-md rounded-lg border border-line bg-panel p-lg shadow-card">
          <header className="flex items-center justify-between gap-sm">
            <Heading level={3} size="title-sm">
              Pending Invitations
            </Heading>
            <Text size="caption" tone="muted">
              {invitations.length} total
            </Text>
          </header>

          <ul className="space-y-sm">
            {invitations.map((invite) => (
              <li key={invite.id} className="rounded-md border border-line bg-panel-muted p-sm">
                <Text weight="medium">{invite.email}</Text>
                <div className="mt-xs flex flex-wrap items-center gap-xs text-caption text-ink-muted">
                  <span className="rounded-full bg-panel px-sm py-2xs">{invite.role}</span>
                  <span className="rounded-full bg-panel px-sm py-2xs">{invite.status}</span>
                  <span className="rounded-full bg-panel px-sm py-2xs">
                    Expires {invite.expiresAtLabel}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {!invitations.length ? (
            <Text size="body-sm" tone="muted">
              No pending invitations.
            </Text>
          ) : null}
        </article>
      </div>

      <article className="space-y-md rounded-lg border border-line bg-panel p-lg shadow-card">
        <div className="rounded-md border border-line bg-panel-muted p-md">
          <div className="flex flex-wrap items-start justify-between gap-sm">
            <div className="space-y-xs">
              <div className="flex items-center gap-xs text-ink">
                <BellRingIcon className="size-4" />
                <Text size="body-sm" weight="medium">
                  Comment Email Updates
                </Text>
              </div>
              <Text size="body-sm" tone="muted">
                Choose whether you want email updates when new comments are posted.
              </Text>
            </div>
            <Button
              type="button"
              size="sm"
              role="switch"
              aria-checked={commentEmailOptIn}
              variant={commentEmailOptIn ? 'default' : 'outline'}
              className="min-w-[7.5rem] whitespace-nowrap"
              disabled={isCommentEmailPreferenceUpdating}
              onClick={handleCommentEmailToggle}
            >
              {isCommentEmailPreferenceUpdating
                ? 'Saving...'
                : commentEmailOptIn
                  ? 'Opt-out'
                  : 'Opt-in'}
            </Button>
          </div>
          <Text size="caption" tone="muted" className="mt-xs">
            {commentEmailOptIn
              ? 'Status: On - you will receive comment updates by email.'
              : 'Status: Off - comment update emails are paused for this trip.'}
          </Text>
        </div>

        <header>
          <Heading level={3} size="title-sm">
            Comment Thread
          </Heading>
          <Text tone="muted" size="body-sm">
            Scoped to current day/activity context.
          </Text>
        </header>

        <div className="max-h-72 space-y-sm overflow-y-auto pr-xs">
          {recentComments.map((comment) => (
            <div key={comment.id} className="rounded-md border border-line bg-panel-muted p-sm">
              <div className="flex items-center gap-sm">
                <Avatar size="sm">
                  <AvatarFallback>{getInitials(comment.authorName)}</AvatarFallback>
                </Avatar>
                <div>
                  <Text size="body-sm" weight="medium">
                    {comment.authorName}
                  </Text>
                  <Text size="caption" tone="muted">
                    {comment.createdAtLabel} - {comment.targetLabel}
                  </Text>
                </div>
              </div>
              <Text size="body-sm" className="mt-sm">
                {comment.body}
              </Text>
            </div>
          ))}
          {!recentComments.length ? (
            <Text size="body-sm" tone="muted">
              No comments yet. Add the first update for this trip.
            </Text>
          ) : null}
        </div>

        <Form
          methods={commentForm}
          onSubmit={handleCommentSubmit}
          persistKey={`trip:${tripId}:collaboration:create-comment`}
          className="space-y-sm"
        >
          {!canComment ? (
            <Text size="body-sm" tone="muted">
              Add itinerary days or activities first, then comments can be posted against those targets.
            </Text>
          ) : null}
          <div className="grid gap-sm sm:grid-cols-2">
            <div className="space-y-xs">
              <label htmlFor="comment-target-type" className="text-body-sm font-medium text-ink">
                Target Type
              </label>
              <select
                id="comment-target-type"
                className="h-10 w-full rounded-md border border-line bg-panel px-lg text-body-sm text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                value={commentTargetType || (hasDayTargets ? 'day' : 'activity')}
                disabled={!canComment}
                onChange={(event) => {
                  const nextTargetType = event.target.value
                  commentForm.setValue('targetType', nextTargetType, {
                    shouldTouch: true,
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                  if (nextTargetType === 'day') {
                    commentForm.setValue('dayId', defaultDayTargetId || undefined, {
                      shouldValidate: true,
                    })
                  } else {
                    commentForm.setValue('activityId', defaultActivityTargetId || undefined, {
                      shouldValidate: true,
                    })
                  }
                }}
              >
                <option value="day" disabled={!hasDayTargets}>Day</option>
                <option value="activity" disabled={!hasActivityTargets}>Activity</option>
              </select>
            </div>

            {commentTargetType === 'day' ? (
              <div className="space-y-xs">
                <label htmlFor="comment-day-target" className="text-body-sm font-medium text-ink">
                  Day
                </label>
                <select
                  id="comment-day-target"
                  className="h-10 w-full rounded-md border border-line bg-panel px-lg text-body-sm text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                  value={selectedDayId || defaultDayTargetId}
                  disabled={!canComment || !hasDayTargets}
                  onChange={(event) =>
                    commentForm.setValue('dayId', event.target.value || undefined, {
                      shouldTouch: true,
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  {dayTargets.map((target) => (
                    <option key={target.id} value={target.id}>
                      {target.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-xs">
                <label htmlFor="comment-activity-target" className="text-body-sm font-medium text-ink">
                  Activity
                </label>
                <select
                  id="comment-activity-target"
                  className="h-10 w-full rounded-md border border-line bg-panel px-lg text-body-sm text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                  value={selectedActivityId || defaultActivityTargetId}
                  disabled={!canComment || !activityTargetOptions.length}
                  onChange={(event) =>
                    commentForm.setValue('activityId', event.target.value || undefined, {
                      shouldTouch: true,
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  {activityTargetOptions.map((target) => (
                    <option key={target.id} value={target.id}>
                      {target.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <RHFTextareaField
            name="body"
            label="Comment"
            hideLabel
            required
            rows={4}
            placeholder="Write a comment for the selected day or activity..."
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={commentForm.formState.isSubmitting || !canComment}
            >
              <SendIcon className="size-4" />
              Post Comment
            </Button>
          </div>
        </Form>
      </article>

      <Dialog
        open={isCommentEmailDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            onOptOutQueryPromptConsumed?.()
          }
          setIsCommentOptOutDialogOpen(nextOpen)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Turn Off Comment Emails?</DialogTitle>
            <DialogDescription>
              You may miss important updates from collaborators. You can turn email updates back on anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-sm sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-auto whitespace-normal text-left sm:text-center"
              disabled={isCommentEmailPreferenceUpdating}
              onClick={() => setIsCommentOptOutDialogOpen(false)}
            >
              Keep Emails On
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-auto whitespace-normal text-left sm:text-center"
              disabled={isCommentEmailPreferenceUpdating}
              onClick={handleCommentEmailOptOutConfirm}
            >
              Turn Off Updates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export { CollaborationPanel }
