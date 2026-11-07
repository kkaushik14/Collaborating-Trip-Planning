import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import SiteFooter from './SiteFooter.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import AuthPageShell from './AuthPageShell.jsx'

test.each(['auth', 'marketing', 'app', 'notFound'])('%s footer only advertises real destinations', (mode) => {
  render(<MemoryRouter><SiteFooter mode={mode} /></MemoryRouter>)
  for (const link of screen.getAllByRole('link')) {
    expect(['/', '/login', '/register', '/trips', '/invitations']).toContain(link.getAttribute('href'))
  }
  expect(screen.queryByText(/Terms Of Service|Privacy Policy|Support|Twitter|LinkedIn|Instagram/)).not.toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Footer' })).toBeInTheDocument()
})

test('theme toggle is controlled, keyboard accessible and respects disabled state', async () => {
  const user = userEvent.setup()
  const onToggle = jest.fn()
  const { rerender } = render(<ThemeToggle theme="dark" onToggle={onToggle} />)
  await user.tab()
  expect(screen.getByRole('switch', { name: 'Dark mode' })).toHaveFocus()
  await user.keyboard(' ')
  expect(onToggle).toHaveBeenCalledTimes(1)
  rerender(<ThemeToggle theme="light" onToggle={onToggle} disabled />)
  expect(screen.getByRole('switch')).not.toBeChecked()
  await user.click(screen.getByRole('switch'))
  expect(onToggle).toHaveBeenCalledTimes(1)
})

test('auth shell optionally exposes a presentational theme toggle', () => {
  const { rerender } = render(<MemoryRouter><AuthPageShell formTitle="Sign in" /></MemoryRouter>)
  expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument()
  expect(screen.queryByRole('switch')).not.toBeInTheDocument()
  rerender(<MemoryRouter><AuthPageShell formTitle="Sign in" theme="light" onToggle={jest.fn()} /></MemoryRouter>)
  expect(screen.getByRole('switch', { name: 'Dark mode' })).not.toBeChecked()
})
