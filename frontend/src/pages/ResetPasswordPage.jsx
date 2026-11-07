import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'

import { useAuth } from '../app/AuthProvider/index.js'
import { usePublicTheme } from '../hooks/index.js'
import { AuthPageShell } from '../components/common/index.js'
import { Form, FormMessage, RHFTextField } from '../components/forms/index.js'
import { Button } from '../components/ui/index.js'
import { useResetPassword } from '../hooks/index.js'
import { resetPasswordSchema } from '../validators/index.js'

const ResetPasswordPage = () => {
  const publicTheme = usePublicTheme()
  const [params, setParams] = useSearchParams()
  const { signOut } = useAuth()
  const token = params.get('token') || ''
  const hasToken = /^[a-f0-9]{64}$/i.test(token)
  const [complete, setComplete] = useState(false)
  const mutation = useResetPassword()
  const form = useForm({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: '', confirmPassword: '' } })

  const onSubmit = async ({ password }) => {
    try {
      await mutation.mutateAsync({ token, password })
      form.reset({ password: '', confirmPassword: '' })
      setComplete(true)
      setParams({}, { replace: true })
      await signOut()
    } catch {
      // Keep fields on API failure. Recovery secrets are never persisted as drafts.
    }
  }

  return (
    <AuthPageShell
      {...publicTheme}
      panelLabel="A fresh start"
      panelTitle="Your plans are waiting for you."
      panelDescription="Choose a new password to protect your account and return to your shared trips."
      formLabel="Account security"
      formTitle={complete ? 'Password updated' : 'Choose a new password'}
      formDescription={complete ? 'Sign in again with your new password.' : 'Use at least 8 characters and choose a password you do not use elsewhere.'}
    >
      {complete ? (
        <p role="status" className="rounded-lg border border-success/40 bg-success/10 p-md text-ink">Your password has been changed. Previous sessions have been signed out.</p>
      ) : !hasToken ? (
        <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 p-md text-ink">This reset link is missing or invalid. Request a new link to continue.</p>
      ) : (
        <Form methods={form} onSubmit={onSubmit} className="space-y-md">
          <RHFTextField name="password" label="New password" type="password" required autoComplete="new-password" />
          <RHFTextField name="confirmPassword" label="Confirm new password" type="password" required autoComplete="new-password" />
          {mutation.error ? <FormMessage>{mutation.error.message || 'This link may have expired. Please request a new one.'}</FormMessage> : null}
          <Button type="submit" className="w-full" disabled={mutation.isPending}>{mutation.isPending ? 'Updating password...' : 'Update password'}</Button>
        </Form>
      )}
      <div className="mt-lg flex flex-wrap justify-center gap-md text-body-sm">
        {!complete ? <Link to="/forgot-password" className="font-medium text-primary hover:underline">Request a new link</Link> : null}
        <Link to="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>
      </div>
    </AuthPageShell>
  )
}

export default ResetPasswordPage
