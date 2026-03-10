import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../app/AuthProvider/index.js'
import { Form, FormMessage, RHFTextField } from '../components/forms/index.js'
import { Button } from '../components/ui/index.js'
import { Heading, Text } from '../components/typography/index.js'
import { signInSchema } from '../validators/index.js'

const LoginPage = () => {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitError, setSubmitError] = useState('')

  const loginForm = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  const fromPath = location.state?.from?.pathname
  const redirectPath = fromPath && fromPath !== '/login' ? fromPath : '/trips'

  const handleSubmit = async (values) => {
    try {
      setSubmitError('')
      await signIn(values)
      navigate(redirectPath, { replace: true })
    } catch (error) {
      setSubmitError(error?.message || 'Unable to sign in. Please try again.')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-xl py-3xl">
      <section className="w-full max-w-md rounded-2xl border border-line bg-panel p-xl shadow-card">
        <header className="space-y-xs">
          <Heading level={1} size="title">
            Sign In
          </Heading>
          <Text tone="muted">
            Use your account to access protected trip planning routes.
          </Text>
        </header>

        <Form methods={loginForm} onSubmit={handleSubmit} className="mt-lg space-y-md">
          <RHFTextField
            name="email"
            label="Email"
            type="email"
            required
            autoComplete="email"
            placeholder="owner@example.com"
          />

          <RHFTextField
            name="password"
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Enter your password"
          />

          {submitError ? <FormMessage>{submitError}</FormMessage> : null}

          <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
            {loginForm.formState.isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </Form>
      </section>
    </main>
  )
}

export default LoginPage
