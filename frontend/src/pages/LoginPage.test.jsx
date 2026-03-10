import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { useAuth } from '../app/AuthProvider/index.js'
import LoginPage from './LoginPage.jsx'

jest.mock('../app/AuthProvider/index.js', () => ({
  useAuth: jest.fn(),
}))

const renderLoginPage = (initialEntries = ['/login']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/trips" element={<div>Trips Dashboard</div>} />
        <Route path="/invitations/accept" element={<div>Invitation Accept Route</div>} />
      </Routes>
    </MemoryRouter>,
  )

describe('LoginPage integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('submits credentials and redirects on success', async () => {
    const user = userEvent.setup()
    const signIn = jest.fn().mockResolvedValueOnce({
      user: { _id: '507f1f77bcf86cd799439011', email: 'owner@example.com' },
    })

    useAuth.mockReturnValue({
      signIn,
    })

    renderLoginPage()

    await user.type(screen.getByLabelText(/email/i), 'owner@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Password@123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith({
        email: 'owner@example.com',
        password: 'Password@123',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Trips Dashboard')).toBeInTheDocument()
    })
  })

  test('shows API error message when sign in fails', async () => {
    const user = userEvent.setup()
    const signIn = jest.fn().mockRejectedValueOnce(new Error('Invalid credentials'))

    useAuth.mockReturnValue({
      signIn,
    })

    renderLoginPage()

    await user.type(screen.getByLabelText(/email/i), 'viewer@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Password@123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  test('preserves redirect query for invitation accept flow after sign in', async () => {
    const user = userEvent.setup()
    const signIn = jest.fn().mockResolvedValueOnce({
      user: { _id: '507f1f77bcf86cd799439011', email: 'owner@example.com' },
    })

    useAuth.mockReturnValue({
      signIn,
    })

    renderLoginPage([
      {
        pathname: '/login',
        state: {
          from: {
            pathname: '/invitations/accept',
            search: '?token=abc123',
          },
        },
      },
    ])

    await user.type(screen.getByLabelText(/email/i), 'owner@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Password@123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Invitation Accept Route')).toBeInTheDocument()
    })
  })
})
