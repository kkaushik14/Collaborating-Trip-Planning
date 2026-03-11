import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../app/AuthProvider/index.js'
import { getRedirectPathFromLocation } from '../app/AuthProvider/redirect-utils.js'
import { AuthPageShell } from '../components/common/index.js'
import { Form, FormMessage, RHFTextField } from '../components/forms/index.js'
import { Button } from '../components/ui/index.js'
import { Text } from '../components/typography/index.js'
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

  const redirectPath = getRedirectPathFromLocation(location, '/trips')

  const handleSubmit = async (values) => {
    try {
      setSubmitError('')
      await signIn(values)
      loginForm.reset({
        email: '',
        password: '',
      })
      navigate(redirectPath, { replace: true })
    } catch (error) {
      setSubmitError(error?.message || 'Unable to sign in. Please try again.')
    }
  }

  return (
    <AuthPageShell
      panelLabel="Operator Access"
      panelTitle="Securely enter your trip operations workspace."
      panelDescription="Authenticate once to continue planning, collaboration, and budget actions with role-based access."
      formLabel="Welcome Back"
      formTitle="Sign in to your account"
      formDescription="Use your credentials to continue planning and collaborating on your trips."
    >
      <Form
        methods={loginForm}
        onSubmit={handleSubmit}
        persistKey="auth:login"
        persistIgnoreFields={['password']}
        className="space-y-md"
      >
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

      <Text tone="muted" size="body-sm" className="mt-md text-center">
        No account yet?{' '}
        <Link
          to={{
            pathname: '/register',
            search: location.search,
          }}
          state={location.state}
          className="font-medium text-primary hover:underline"
        >
          Register
        </Link>
      </Text>
    </AuthPageShell>
  )
}

export default LoginPage
