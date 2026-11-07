import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'

import { FormMessage, RHFTextField } from '../components/forms/index.js'
import { useCreateInvitationAcceptance, useMyInvitations, useUIStore } from '../hooks/index.js'
import { Button } from '../components/ui/index.js'
import { Heading, Text } from '../components/typography/index.js'
import { PageErrorState, PageLoadingState, PageForm } from './PageStates.jsx'
import { formatDateLabel } from './tripPageUtils.js'

const invitationAcceptSchema = z.object({
  token: z.string().trim().min(1, 'Invitation token is required'),
})

const InvitationsPage = () => {
  const invitationsQuery = useMyInvitations()
  const acceptInvitationMutation = useCreateInvitationAcceptance()
  const { addToast } = useUIStore()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const autoAcceptRequestedRef = useRef(new Set())

  const acceptForm = useForm({
    resolver: zodResolver(invitationAcceptSchema),
    defaultValues: {
      token: '',
    },
  })
  const tokenFromQuery = searchParams.get('token')?.trim() || ''

  const handleAcceptSubmit = useCallback(
    (values, { clearTokenFromUrl = false } = {}) => {
      if (acceptInvitationMutation.isPending) return
      acceptInvitationMutation.mutate(values, {
        onSuccess: (data) => {
          acceptForm.reset({
            token: '',
          })

          addToast({
            type: 'success',
            title: 'Invitation accepted',
            message: 'You have joined the trip workspace.',
            durationMs: 3800,
          })

          if (clearTokenFromUrl) {
            const nextSearchParams = new URLSearchParams(searchParams)
            nextSearchParams.delete('token')
            setSearchParams(nextSearchParams, { replace: true })
          }

          const tripId = data?.invitation?.trip?._id || data?.invitation?.trip
          if (tripId) {
            navigate(`/trips/${tripId}/collaboration`, { replace: true })
            return
          }

          navigate('/trips', { replace: true })
        },
        onError: (error) => {
          addToast({
            type: 'error',
            title: 'Invitation acceptance failed',
            message: error?.message || 'Please check token and try again.',
            durationMs: 4500,
          })
        },
      })
    },
    [acceptForm, acceptInvitationMutation, addToast, navigate, searchParams, setSearchParams],
  )

  useEffect(() => {
    if (!tokenFromQuery) {
      return
    }

    acceptForm.setValue('token', tokenFromQuery, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    })
  }, [acceptForm, tokenFromQuery])

  useEffect(() => {
    if (!tokenFromQuery || autoAcceptRequestedRef.current.has(tokenFromQuery) || acceptInvitationMutation.isPending) {
      return
    }

    autoAcceptRequestedRef.current.add(tokenFromQuery)
    handleAcceptSubmit({ token: tokenFromQuery }, { clearTokenFromUrl: true })
  }, [acceptInvitationMutation.isPending, handleAcceptSubmit, tokenFromQuery])

  const invitations = invitationsQuery.data?.invitations || []
  const pendingInvitations = invitations.filter((invitation) => invitation.status === 'pending')

  return (
    <section className="min-w-0 max-w-full space-y-lg">
      <header className="space-y-xs">
        <Heading level={1} size="title">
          My Invitations
        </Heading>
        <Text tone="muted">
          Review your pending invites and join trips shared with you.
        </Text>
      </header>

      <article className="min-w-0 break-words rounded-xl border border-line bg-panel p-md shadow-card sm:p-lg">
        <h2 className="text-title-sm font-semibold text-ink">Join a Shared Trip</h2>
        {tokenFromQuery ? (
          <Text size="body-sm" tone="muted" className="mt-sm">
            {acceptInvitationMutation.isPending ? 'Accepting the invitation from your email link...' : 'Invitation loaded from your email link. If it was not accepted, check the message below and try again.'}
          </Text>
        ) : null}
        <PageForm
          methods={acceptForm}
          disabled={acceptInvitationMutation.isPending}
          onSubmit={(values) =>
            handleAcceptSubmit(values, {
              clearTokenFromUrl: Boolean(tokenFromQuery),
            })
          }
          className="mt-md space-y-sm"
        >
          <RHFTextField
            name="token"
            label="Invitation Code"
            required
            placeholder="Paste the invitation code from your email link"
          />
          {acceptInvitationMutation.error ? (
            <FormMessage>{acceptInvitationMutation.error?.message}</FormMessage>
          ) : null}
          <Button type="submit" disabled={acceptInvitationMutation.isPending}>
            {acceptInvitationMutation.isPending ? 'Accepting...' : 'Accept Invitation'}
          </Button>
        </PageForm>
      </article>

      {invitationsQuery.isPending ? <PageLoadingState title="Loading invitations..." description="Fetching invitations for your account." /> : invitationsQuery.error ? (
        <PageErrorState title="Unable to load invitations" description="You can still accept an invitation using its code above." errorMessage={invitationsQuery.error.message} onRetry={() => invitationsQuery.refetch()} />
      ) : <article className="min-w-0 break-words rounded-xl border border-line bg-panel p-md shadow-card sm:p-lg">
        <h2 className="text-title-sm font-semibold text-ink">Pending Invitations</h2>
        {pendingInvitations.length ? (
          <ul className="mt-md space-y-sm">
            {pendingInvitations.map((invitation) => (
              <li
                key={invitation._id}
                className="rounded-lg border border-line bg-panel-muted p-sm"
              >
                <Text weight="medium">{invitation.email}</Text>
                <Text size="body-sm" tone="muted">
                  Role: {invitation.role} · Expires: {formatDateLabel(invitation.expiresAt)}
                </Text>
                <Text size="caption" tone="muted">
                  {invitation.trip?.title || 'Open the invitation email sent to this address to join the trip.'}
                </Text>
              </li>
            ))}
          </ul>
        ) : (
          <Text tone="muted" className="mt-sm">
            No pending invitations. Ask a trip owner or editor to invite your account email, or <Link className="text-primary underline" to="/trips">create your own trip</Link>.
          </Text>
        )}
      </article>}
    </section>
  )
}

export default InvitationsPage
