import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { useAuth } from '../app/AuthProvider/index.js'
import { useRequestPasswordReset, useResetPassword } from '../hooks/index.js'
import ForgotPasswordPage from './ForgotPasswordPage.jsx'
import ResetPasswordPage from './ResetPasswordPage.jsx'

jest.mock('../hooks/index.js', () => ({ useRequestPasswordReset: jest.fn(), useResetPassword: jest.fn(), usePublicTheme: () => ({ theme: 'dark' }) }))
jest.mock('../app/AuthProvider/index.js', () => ({ useAuth: jest.fn() }))

const token = 'a'.repeat(64)
const renderPage = (page, url) => render(<MemoryRouter initialEntries={[url]}>{page}</MemoryRouter>)

beforeEach(() => {
  jest.clearAllMocks()
  useAuth.mockReturnValue({ signOut: jest.fn().mockResolvedValue() })
})

test('requests a reset and displays an enumeration-safe confirmation', async () => {
  const mutateAsync = jest.fn().mockResolvedValue({ success: true })
  useRequestPasswordReset.mockReturnValue({ mutateAsync, reset: jest.fn() })
  renderPage(<ForgotPasswordPage />, '/forgot-password?next=%2Finvitations')
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/registered email/i), 'person@example.com')
  await user.click(screen.getByRole('button', { name: 'Send reset link' }))
  await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ email: 'person@example.com' }))
  expect(await screen.findByRole('status')).toHaveTextContent('If an account exists')
  expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute('href', '/login?next=%2Finvitations')
})

test('retains the email when requesting a reset fails', async () => {
  useRequestPasswordReset.mockReturnValue({ mutateAsync: jest.fn().mockRejectedValue(new Error('Try again')), error: new Error('Try again') })
  renderPage(<ForgotPasswordPage />, '/forgot-password')
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/registered email/i), 'person@example.com')
  await user.click(screen.getByRole('button', { name: 'Send reset link' }))
  await waitFor(() => expect(screen.getByText('Try again')).toBeVisible())
  expect(screen.getByLabelText(/registered email/i)).toHaveValue('person@example.com')
})

test('rejects missing reset tokens without rendering password inputs', () => {
  useResetPassword.mockReturnValue({ mutateAsync: jest.fn() })
  renderPage(<ResetPasswordPage />, '/reset-password')
  expect(screen.getByRole('alert')).toHaveTextContent('missing or invalid')
  expect(screen.queryByLabelText(/^new password/i)).not.toBeInTheDocument()
})

test('requires matching passwords and clears secrets only after successful reset', async () => {
  const mutateAsync = jest.fn().mockResolvedValue({ success: true })
  const signOut = jest.fn().mockResolvedValue()
  useResetPassword.mockReturnValue({ mutateAsync })
  useAuth.mockReturnValue({ signOut })
  renderPage(<ResetPasswordPage />, `/reset-password?token=${token}`)
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/^new password/i), 'UniquePassword123!')
  await user.type(screen.getByLabelText(/confirm new password/i), 'DifferentPassword123!')
  await user.click(screen.getByRole('button', { name: 'Update password' }))
  expect(await screen.findByText('Passwords must match')).toBeVisible()
  expect(mutateAsync).not.toHaveBeenCalled()
  await user.clear(screen.getByLabelText(/confirm new password/i))
  await user.type(screen.getByLabelText(/confirm new password/i), 'UniquePassword123!')
  await user.click(screen.getByRole('button', { name: 'Update password' }))
  await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ token, password: 'UniquePassword123!' }))
  expect(await screen.findByRole('status')).toHaveTextContent('Your password has been changed')
  await waitFor(() => expect(signOut).toHaveBeenCalled())
  expect(window.sessionStorage.length).toBe(0)
})

test('retains password fields after a failed reset and offers a new link', async () => {
  useResetPassword.mockReturnValue({ mutateAsync: jest.fn().mockRejectedValue(new Error('Link expired')), error: new Error('Link expired') })
  renderPage(<ResetPasswordPage />, `/reset-password?token=${token}`)
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/^new password/i), 'UniquePassword123!')
  await user.type(screen.getByLabelText(/confirm new password/i), 'UniquePassword123!')
  await user.click(screen.getByRole('button', { name: 'Update password' }))
  await waitFor(() => expect(screen.getByText('Link expired')).toBeVisible())
  expect(screen.getByLabelText(/^new password/i)).toHaveValue('UniquePassword123!')
  expect(screen.getByRole('link', { name: 'Request a new link' })).toHaveAttribute('href', '/forgot-password')
})
