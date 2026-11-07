import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router-dom'

import { usePublicTheme } from '../hooks/index.js'
import { AuthPageShell } from '../components/common/index.js'
import { Form, FormMessage, RHFTextField } from '../components/forms/index.js'
import { Button } from '../components/ui/index.js'
import { useRequestPasswordReset } from '../hooks/index.js'
import { forgotPasswordSchema } from '../validators/index.js'

const ForgotPasswordPage = () => {
  const publicTheme = usePublicTheme()
  const location = useLocation()
  const [sent, setSent] = useState(false)
  const mutation = useRequestPasswordReset()
  const form = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } })

  const onSubmit = async (values) => {
    try {
      await mutation.mutateAsync(values)
      form.reset({ email: '' })
      setSent(true)
    } catch {
      // Mutation state displays the standardized service error; keep entered values.
    }
  }

  return (
    <AuthPageShell
      {...publicTheme}
      panelLabel="Account recovery"
      panelTitle="Get back to planning your next adventure."
      panelDescription="We'll help you recover access without changing your trips or shared plans."
      formLabel="Forgot your password?"
      formTitle={sent ? 'Check your inbox' : 'Reset your password'}
      formDescription="Enter the email address you used to register."
    >
      {sent ? (
        <div className="space-y-md">
          <p role="status" className="rounded-lg border border-success/40 bg-success/10 p-md text-ink">
            If an account exists for that email, a password reset link will arrive shortly. Check your spam folder too.
          </p>
          <p className="text-body-sm text-ink-muted">Only the most recent link can be used. Never share it with anyone.</p>
          <Button type="button" variant="outline" className="w-full" onClick={() => { mutation.reset(); setSent(false) }}>
            Try another email
          </Button>
        </div>
      ) : (
        <Form methods={form} onSubmit={onSubmit} className="space-y-md">
          <RHFTextField name="email" label="Registered email" type="email" required autoComplete="email" placeholder="you@example.com" />
          {mutation.error ? <FormMessage>{mutation.error.message || 'Unable to request a reset. Please try again.'}</FormMessage> : null}
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Sending request...' : 'Send reset link'}
          </Button>
        </Form>
      )}
      <p className="mt-lg text-center text-body-sm">
        <Link to={{ pathname: '/login', search: location.search }} state={location.state} className="font-medium text-primary hover:underline">Back to sign in</Link>
      </p>
    </AuthPageShell>
  )
}

export default ForgotPasswordPage
