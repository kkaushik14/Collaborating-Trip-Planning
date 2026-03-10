import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../app/AuthProvider/index.js'
import { AuthPageShell } from '../components/common/index.js'
import { Form, FormMessage, RHFTextField } from '../components/forms/index.js'
import { Button } from '../components/ui/index.js'
import { Text } from '../components/typography/index.js'
import { signUpSchema } from '../validators/index.js'

const RegisterPage = () => {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitError, setSubmitError] = useState('')

  const registerForm = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  const fromLocation = location.state?.from
  const fromPathname = fromLocation?.pathname
  const fromSearch = fromLocation?.search || ''
  const redirectPath =
    fromPathname && fromPathname !== '/login' && fromPathname !== '/register'
      ? `${fromPathname}${fromSearch}`
      : '/trips'

  const handleSubmit = async (values) => {
    try {
      setSubmitError('')
      await signUp(values)
      navigate(redirectPath, { replace: true })
    } catch (error) {
      setSubmitError(error?.message || 'Unable to register. Please try again.')
    }
  }

  return (
    <AuthPageShell
      panelLabel="New Workspace Setup"
      panelTitle="Create your account and launch collaborative trip planning."
      panelDescription="Onboarding is lightweight and gives you immediate access to trips, roles, organization, and analytics modules."
      formLabel="Get Started"
      formTitle="Create your account"
      formDescription="Register once and start managing trip planning, collaboration, and budgets."
    >
      <Form methods={registerForm} onSubmit={handleSubmit} className="space-y-md">
        <RHFTextField
          name="name"
          label="Full Name"
          required
          autoComplete="name"
          placeholder="Enter your name"
        />

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
          autoComplete="new-password"
          placeholder="Minimum 8 characters"
        />

        {submitError ? <FormMessage>{submitError}</FormMessage> : null}

        <Button type="submit" className="w-full" disabled={registerForm.formState.isSubmitting}>
          {registerForm.formState.isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </Form>

      <Text tone="muted" size="body-sm" className="mt-md text-center">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </Text>
    </AuthPageShell>
  )
}

export default RegisterPage
