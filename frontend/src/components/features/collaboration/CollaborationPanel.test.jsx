import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '../../test-platform.js'

import { CollaborationPanel } from './CollaborationPanel.jsx'

const members = [
  { id: 'owner', name: 'Trip Owner', email: 'owner@example.com', role: 'OWNER', isActive: true },
  { id: 'viewer', name: 'Traveler', email: 'viewer@example.com', role: 'VIEWER', isActive: false },
]

test('membership count does not claim presence and owners have no ordinary edit/deactivate controls', () => {
  render(<CollaborationPanel members={members} />)
  expect(screen.getByText('1 member')).toBeInTheDocument()
  expect(screen.queryByText(/online/i)).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Change role for Trip Owner|Deactivate Trip Owner/ })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Reactivate Traveler' })).toBeInTheDocument()
  expect(screen.getByRole('switch', { name: 'Email notifications for comments' })).toBeChecked()
})

test('member role menus exclude ownership and preserve callback boundaries', async () => {
  const user = userEvent.setup()
  const changeRole = jest.fn()
  render(<CollaborationPanel members={members} onMemberRoleChange={changeRole} />)
  await user.click(screen.getByRole('button', { name: 'Change role for Traveler: VIEWER' }))
  const editor = await screen.findByRole('menuitem', { name: 'EDITOR' })
  expect(screen.queryByRole('menuitem', { name: 'OWNER' })).not.toBeInTheDocument()
  await user.click(editor)
  expect(changeRole).toHaveBeenCalledWith('viewer', 'EDITOR')
})

test('read-only permissions disable member actions and switch name is stable when off', () => {
  render(<CollaborationPanel members={members} canManageMembers={false} commentEmailOptIn={false} />)
  expect(screen.getByRole('button', { name: 'Reactivate Traveler' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Change role for Traveler: VIEWER' })).toBeDisabled()
  expect(screen.getByRole('switch', { name: 'Email notifications for comments' })).not.toBeChecked()
})
