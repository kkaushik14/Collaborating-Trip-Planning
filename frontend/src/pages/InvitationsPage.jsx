import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'

import { Form, FormMessage, RHFTextField } from '../components/forms/index.js'
import { useCreateInvitationAcceptance, useMyInvitations, useUIStore } from '../hooks/index.js'
import { Button } from '../components/ui/index.js'
import { Heading, Text } from '../components/typography/index.js'
import { PageErrorState, PageLoadingState } from './PageStates.jsx'
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
  const autoAcceptRequestedRef = useRef(false)

  const acceptForm = useForm({
    resolver: zodResolver(invitationAcceptSchema),
    defaultValues: {
      token: '',
    },
  })
  const tokenFromQuery = searchParams.get('token')?.trim() || ''

  const handleAcceptSubmit = useCallback(
    (values, { clearTokenFromUrl = false } = {}) => {
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

          const tripId = data?.invitation?.trip
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
    if (!tokenFromQuery || autoAcceptRequestedRef.current) {
      return
    }

    autoAcceptRequestedRef.current = true
    handleAcceptSubmit({ token: tokenFromQuery }, { clearTokenFromUrl: true })
  }, [handleAcceptSubmit, tokenFromQuery])

  const invitations = invitationsQuery.data?.invitations || []
  const pendingInvitations = invitations.filter((invitation) => invitation.status === 'pending')

  if (invitationsQuery.isPending) {
    return (
      <PageLoadingState
        title="Loading invitations..."
        description="Fetching invitations for your account."
      />
    )
  }

  if (invitationsQuery.error) {
    return (
      <PageErrorState
        title="Unable to load invitations"
        description="The invitation list endpoint returned an error."
        errorMessage={invitationsQuery.error?.message}
        onRetry={() => invitationsQuery.refetch()}
      />
    )
  }

  return (
    <section className="space-y-lg">
      <header className="space-y-xs">
        <Heading level={1} size="title">
          My Invitations
        </Heading>
        <Text tone="muted">
          Accept invitation tokens and join shared trip workspaces.
        </Text>
      </header>

      <article className="rounded-xl border border-line bg-panel p-lg shadow-card">
        <h2 className="text-title-sm font-semibold text-ink">Accept Invitation Token</h2>
        {tokenFromQuery ? (
          <Text size="body-sm" tone="muted" className="mt-sm">
            Invitation token detected from email link. Accepting automatically.
          </Text>
        ) : null}
        <Form
          methods={acceptForm}
          onSubmit={(values) =>
            handleAcceptSubmit(values, {
              clearTokenFromUrl: Boolean(tokenFromQuery),
            })
          }
          className="mt-md space-y-sm"
        >
          <RHFTextField
            name="token"
            label="Token"
            required
            placeholder="Paste invitation token from invite URL"
          />
          {acceptInvitationMutation.error ? (
            <FormMessage>{acceptInvitationMutation.error?.message}</FormMessage>
          ) : null}
          <Button type="submit" disabled={acceptInvitationMutation.isPending}>
            {acceptInvitationMutation.isPending ? 'Accepting...' : 'Accept Invitation'}
          </Button>
        </Form>
      </article>

      <article className="rounded-xl border border-line bg-panel p-lg shadow-card">
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
                  Trip ID: {invitation.trip}
                </Text>
              </li>
            ))}
          </ul>
        ) : (
          <Text tone="muted" className="mt-sm">
            No pending invitations found for this account.
          </Text>
        )}
      </article>
    </section>
  )
}

export default InvitationsPage
