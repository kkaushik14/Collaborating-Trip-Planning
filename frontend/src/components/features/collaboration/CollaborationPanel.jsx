import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { MailPlusIcon, MoreHorizontalIcon, SendIcon, Users2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'

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
import { commentInputSchema, inviteMemberSchema } from '@/validators/index.js'
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
  members = [],
  invitations = [],
  comments = [],
  onInviteSubmit,
  onMemberRoleChange,
  onMemberActiveToggle,
  onCommentSubmit,
  className,
}) {
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteRole, setInviteRole] = useState('VIEWER')
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
    resolver: zodResolver(commentInputSchema),
    defaultValues: {
      body: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  const visibleMembers = members.filter((member) => member.isActive)
  const hiddenCount = Math.max(0, members.length - 3)
  const recentComments = useMemo(() => comments.slice(0, 8), [comments])

  const handleInviteSubmit = (values) => {
    onInviteSubmit?.(values)
    inviteForm.reset({
      email: '',
      role: 'VIEWER',
    })
    setInviteRole('VIEWER')
    setIsInviteOpen(false)
  }

  const handleCommentSubmit = ({ body }) => {
    onCommentSubmit?.(body)
    commentForm.reset({
      body: '',
    })
  }

  return (
    <section className={cn('space-y-lg', className)}>
      <header className="flex flex-wrap items-start justify-between gap-md">
        <div className="space-y-xs">
          <Heading level={2}>Collaboration Workspace</Heading>
          <Text tone="muted">
            Invite members, manage roles, and keep conversation anchored to trip context.
          </Text>
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
          <DialogTrigger>
            <Button size="sm" className="w-full sm:w-auto">
              <MailPlusIcon className="size-4" />
              Invite Member
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a collaborator</DialogTitle>
              <DialogDescription>
                Send an invite with role assignment. This panel is presentational and emits data through callback props.
              </DialogDescription>
            </DialogHeader>

            <Form
              methods={inviteForm}
              onSubmit={handleInviteSubmit}
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
                  disabled={inviteForm.formState.isSubmitting}
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
                    <DropdownMenuTrigger>
                      <Button size="sm" variant="outline" className="w-full sm:w-auto">
                        {member.role}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {ROLE_OPTIONS.map((role) => (
                        <DropdownMenuItem
                          key={role}
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
        </article>
      </div>

      <article className="space-y-md rounded-lg border border-line bg-panel p-lg shadow-card">
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
        </div>

        <Form
          methods={commentForm}
          onSubmit={handleCommentSubmit}
          className="space-y-sm"
        >
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
              disabled={commentForm.formState.isSubmitting}
            >
              <SendIcon className="size-4" />
              Post Comment
            </Button>
          </div>
        </Form>
      </article>
    </section>
  )
}

export { CollaborationPanel }
