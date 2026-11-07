import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useOutletContext } from 'react-router-dom'

import * as hooks from '../hooks/index.js'
import { CollaborationPanel, TripPlanningPanel } from '../components/features/index.js'
import TripPlanningPage from './TripPlanningPage.jsx'
import TripCollaborationPage from './TripCollaborationPage.jsx'
import TripOrganizationPage from './TripOrganizationPage.jsx'
import TripAnalyticsPage from './TripAnalyticsPage.jsx'
import InvitationsPage from './InvitationsPage.jsx'

jest.mock('../hooks/index.js', () => Object.fromEntries([
  'useCreateActivityCard', 'useCreateItineraryDay', 'useItineraryDays', 'useUpdateActivityOrder',
  'useCreateTripComment', 'useCreateTripInvitation', 'useCreateTripMemberReactivation',
  'useCreateTripOwnershipTransfer', 'useDeleteTripMember', 'useTripComments', 'useTripInvitations',
  'useTripMembers', 'useUpdateMyTripCommentEmailPreference', 'useUpdateTripMemberRole',
  'useAttachments', 'useChecklists', 'useCreateAttachment', 'useCreateAttachmentUpload',
  'useCreateChecklist', 'useCreateChecklistItem', 'useCreateExpense', 'useCreateReservation',
  'useExpenses', 'useReservations', 'useTripBudgetSummary', 'useUpdateTripBudget', 'useUpdateChecklistItem',
  'useCreateCurrencyConversion', 'useCreateReportSnapshot', 'useExpenseAnalytics',
  'useReportSnapshotDownload', 'useReportSnapshots', 'useSettlementReport', 'useTripExchangeRates',
  'useUpdateTripExchangeRate', 'useCreateInvitationAcceptance', 'useMyInvitations', 'useUIStore',
].map((name) => [name, jest.fn()])))
jest.mock('../app/AuthProvider/index.js', () => ({ useAuth: () => ({ currentUser: { _id: 'owner' } }) }))
jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useOutletContext: jest.fn() }))
jest.mock('../components/features/index.js', () => ({
  TripPlanningPanel: jest.fn(() => null),
  CollaborationPanel: jest.fn(() => null),
  OrganizationPanel: jest.fn(() => null),
  AnalyticsPanel: jest.fn(() => null),
}))

const dayId = '507f1f77bcf86cd799439011'
const context = { tripId: 'trip-1', trip: { actorRole: 'OWNER', title: 'Goa', startDate: '2026-11-08', endDate: '2026-11-10', settings: { currency: 'INR' } } }
const mutation = (extra = {}) => ({ mutate: jest.fn(), mutateAsync: jest.fn(), reset: jest.fn(), isPending: false, ...extra })
const query = (data = {}) => ({ data, isPending: false, refetch: jest.fn() })
const renderPage = (Page, route = '/') => render(<MemoryRouter initialEntries={[route]}><Page /></MemoryRouter>)
const panelProps = (panel) => panel.mock.calls.at(-1)[0]

beforeEach(() => {
  jest.clearAllMocks()
  useOutletContext.mockReturnValue(context)
  for (const [name, hook] of Object.entries(hooks)) {
    if (!jest.isMockFunction(hook)) continue
    hook.mockReturnValue(/^use(Create|Update|Delete|ReportSnapshotDownload)/.test(name) ? mutation() : query())
  }
  hooks.useUIStore.mockReturnValue({ addToast: jest.fn() })
})

test('viewers can load collaboration without requesting forbidden invitations', () => {
  useOutletContext.mockReturnValue({ ...context, trip: { ...context.trip, actorRole: 'VIEWER' } })
  hooks.useTripInvitations.mockReturnValue({ isPending: true, error: new Error('Forbidden'), refetch: jest.fn() })
  renderPage(TripCollaborationPage)
  expect(hooks.useTripInvitations).toHaveBeenCalledWith({ tripId: 'trip-1', queryOptions: { enabled: false } })
  expect(CollaborationPanel).toHaveBeenCalled()
  expect(panelProps(CollaborationPanel).canManageMembers).toBe(false)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('ownership selection does not transfer until explicit confirmation; preserves failed selection', async () => {
  const user = userEvent.setup()
  const transfer = mutation()
  hooks.useCreateTripOwnershipTransfer.mockReturnValue(transfer)
  hooks.useTripMembers.mockReturnValue(query({ members: [
    { _id: 'm1', userId: { _id: 'other', name: 'Alex', email: 'alex@example.com' }, role: 'EDITOR', isActive: true },
    { _id: 'm2', user: { _id: 'owner', name: 'Owner', email: 'owner@example.com' }, role: 'OWNER', isActive: true, commentEmailOptIn: false },
  ] }))
  renderPage(TripCollaborationPage)
  const select = screen.getByLabelText('New owner')
  await user.selectOptions(select, 'other')
  expect(transfer.mutate).not.toHaveBeenCalled()
  expect(panelProps(CollaborationPanel).members[0]).toEqual(expect.objectContaining({ userId: 'other', name: 'Alex' }))
  expect(panelProps(CollaborationPanel).commentEmailOptIn).toBe(false)
  await user.click(screen.getByRole('button', { name: 'Transfer Ownership' }))
  expect(transfer.mutate).toHaveBeenCalledWith({ tripId: 'trip-1', body: { newOwnerUserId: 'other' } }, expect.any(Object))
  expect(select).toHaveValue('other')
  act(() => transfer.mutate.mock.calls[0][1].onSuccess())
  expect(select).toHaveValue('')
})

test('member errors are visible and blank comments never mutate', async () => {
  hooks.useUpdateTripMemberRole.mockReturnValue(mutation({ error: new Error('Could not save role') }))
  renderPage(TripCollaborationPage)
  expect(screen.getByRole('alert')).toHaveTextContent('Could not save role')
  await expect(panelProps(CollaborationPanel).onCommentSubmit({ body: ' ', targetType: 'day', dayId })).rejects.toThrow()
  expect(hooks.useCreateTripComment().mutateAsync).not.toHaveBeenCalled()
})

test('add activity focuses a real draft without creating placeholder records', () => {
  hooks.useItineraryDays.mockReturnValue(query({ days: [{ _id: dayId, dayNumber: 1, date: '2026-11-08', activities: [] }] }))
  renderPage(TripPlanningPage)
  act(() => panelProps(TripPlanningPanel).onAddActivity(dayId))
  expect(hooks.useCreateActivityCard().mutate).not.toHaveBeenCalled()
  const activityArticle = screen.getByRole('heading', { name: 'Create Activity Card' }).closest('article')
  expect(within(activityArticle).getByLabelText(/^Title/)).toHaveFocus()
  expect(screen.getByLabelText('Day')).toHaveValue(dayId)
})

test('day defaults initialize after query loading and advance without exceeding trip end', async () => {
  const user = userEvent.setup()
  const create = mutation()
  hooks.useCreateItineraryDay.mockReturnValue(create)
  hooks.useItineraryDays.mockReturnValue({ isPending: true })
  const view = renderPage(TripPlanningPage)
  hooks.useItineraryDays.mockReturnValue(query({ days: [{ _id: dayId, dayNumber: 1, date: '2026-11-08' }] }))
  view.rerender(<MemoryRouter><TripPlanningPage /></MemoryRouter>)
  expect(screen.getByLabelText(/^Day Number/)).toHaveValue(2)
  expect(screen.getByLabelText(/^Date/)).toHaveValue('2026-11-09')
  await user.click(screen.getByRole('button', { name: 'Create Day' }))
  await waitFor(() => expect(create.mutate).toHaveBeenCalledTimes(1))
  expect(screen.getByLabelText(/^Date/)).toHaveValue('2026-11-09')
  act(() => create.mutate.mock.calls[0][1].onSuccess())
  expect(screen.getByLabelText(/^Date/)).toHaveValue('2026-11-10')
  await user.click(screen.getByRole('button', { name: 'Create Day' }))
  await waitFor(() => expect(create.mutate).toHaveBeenCalledTimes(2))
  act(() => create.mutate.mock.calls[1][1].onSuccess())
  expect(screen.getByLabelText(/^Date/)).toHaveValue('')
})

test('planning controls disable for viewers and activity form disables without days', () => {
  useOutletContext.mockReturnValue({ ...context, trip: { ...context.trip, actorRole: 'VIEWER' } })
  renderPage(TripPlanningPage)
  expect(screen.getByLabelText(/^Day Number/)).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Create Activity' })).toBeDisabled()
  expect(screen.getByText(/Ask a trip owner or editor/)).toBeInTheDocument()
})

test('organization uses saved budget and disallows adding items without a checklist', () => {
  hooks.useTripBudgetSummary.mockReturnValue(query({ budget: { currency: 'INR', totalBudget: 4200 }, summary: { spentTotal: 135 } }))
  renderPage(TripOrganizationPage)
  expect(screen.getByRole('button', { name: 'Add Item' })).toBeDisabled()
  expect(screen.getByLabelText(/^Item Label/)).toBeDisabled()
  expect(screen.getByLabelText(/^Total Budget/)).toHaveValue(4200)
  expect(screen.getByText('Create a checklist before adding items.')).toBeInTheDocument()
  expect(screen.getAllByRole('combobox', { name: 'Type' })).toHaveLength(2)
  expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('food')
})

test('upload retains the selected file for retries and clears only on success', async () => {
  const user = userEvent.setup()
  const upload = mutation()
  hooks.useCreateAttachmentUpload.mockReturnValue(upload)
  renderPage(TripOrganizationPage)
  const file = new File(['ticket'], 'ticket.pdf', { type: 'application/pdf' })
  await user.upload(screen.getByLabelText('Choose a file'), file)
  expect(upload.mutate).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Upload File' }))
  expect(upload.mutate.mock.calls[0][0].formData.get('file')).toBe(file)
  expect(screen.getByLabelText('Choose a file').files[0]).toBe(file)
  await user.click(screen.getByRole('button', { name: 'Upload File' }))
  expect(upload.mutate).toHaveBeenCalledTimes(2)
  act(() => upload.mutate.mock.calls[1][1].onSuccess())
  expect(screen.getByLabelText('Choose a file').files).toHaveLength(0)
})

test('viewers may convert currency and create snapshots but not change rates', async () => {
  const user = userEvent.setup()
  useOutletContext.mockReturnValue({ ...context, trip: { ...context.trip, actorRole: 'VIEWER' } })
  renderPage(TripAnalyticsPage)
  expect(screen.getByLabelText(/^Rate/)).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Save Rate' })).toBeDisabled()
  expect(screen.queryByLabelText(/As Of/)).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Convert' }))
  await waitFor(() => expect(hooks.useCreateCurrencyConversion().mutate).toHaveBeenCalled())
  await user.click(screen.getByRole('button', { name: 'Create Snapshot' }))
  await waitFor(() => expect(hooks.useCreateReportSnapshot().mutate).toHaveBeenCalled())
})

test('downloads require a button click, permit repeat downloads and preserve CSV extension', async () => {
  const user = userEvent.setup()
  const download = mutation()
  hooks.useReportSnapshotDownload.mockReturnValue(download)
  hooks.useReportSnapshots.mockReturnValue(query({ snapshots: [{ _id: 'csv1', reportType: 'expenses', format: 'csv' }] }))
  renderPage(TripAnalyticsPage)
  await user.selectOptions(screen.getByLabelText('Report to download'), 'csv1')
  expect(download.mutate).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Download Report' }))
  await user.click(screen.getByRole('button', { name: 'Download Report' }))
  expect(download.mutate).toHaveBeenCalledTimes(2)
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
    expect(this.download).toBe('snapshot-csv1.csv')
  })
  URL.createObjectURL = jest.fn(() => 'blob:report')
  URL.revokeObjectURL = jest.fn()
  jest.useFakeTimers()
  act(() => download.mutate.mock.calls[0][1].onSuccess({ contentType: 'text/csv', content: 'amount\n5' }))
  expect(click).toHaveBeenCalledTimes(1)
  act(() => jest.runOnlyPendingTimers())
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:report')
  jest.useRealTimers()
  click.mockRestore()
})

test('invitation acceptance remains usable when list fails and does not persist secrets', async () => {
  const user = userEvent.setup()
  hooks.useMyInvitations.mockReturnValue({ error: new Error('List unavailable') })
  renderPage(InvitationsPage)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('My Invitations')
  await user.type(screen.getByLabelText(/^Invitation Code/), 'secret')
  await user.click(screen.getByRole('button', { name: 'Accept Invitation' }))
  await waitFor(() => expect(hooks.useCreateInvitationAcceptance().mutate).toHaveBeenCalled())
  expect(JSON.stringify({ ...sessionStorage })).not.toContain('secret')
})

test('pending invitation acceptance disables native fields and blocks repeated submit', async () => {
  const accept = mutation({ isPending: true })
  hooks.useCreateInvitationAcceptance.mockReturnValue(accept)
  renderPage(InvitationsPage)
  const input = screen.getByLabelText(/^Invitation Code/)
  expect(input).toBeDisabled()
  await act(async () => fireEvent.submit(input.closest('form')))
  expect(accept.mutate).not.toHaveBeenCalled()
})
