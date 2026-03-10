import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import {
  useCreateTrip,
  useTrips,
  useUpdateTrip,
} from '../hooks/index.js'
import TripsPage from './TripsPage.jsx'

jest.mock('../hooks/index.js', () => ({
  useTrips: jest.fn(),
  useCreateTrip: jest.fn(),
  useUpdateTrip: jest.fn(),
}))

const createTripMutate = jest.fn()
const updateTripMutate = jest.fn()

const defaultTrip = {
  _id: '507f1f77bcf86cd799439015',
  title: 'Existing Trip',
  description: 'Existing description',
  startDate: '2026-05-01',
  endDate: '2026-05-06',
  travelerCount: 3,
  actorRole: 'OWNER',
  currency: 'USD',
}

const renderTripsPage = () =>
  render(
    <MemoryRouter>
      <TripsPage />
    </MemoryRouter>,
  )

describe('TripsPage integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    useTrips.mockReturnValue({
      isPending: false,
      error: null,
      data: {
        trips: [defaultTrip],
      },
      refetch: jest.fn(),
    })

    useCreateTrip.mockReturnValue({
      mutate: createTripMutate,
      isPending: false,
      error: null,
    })

    useUpdateTrip.mockReturnValue({
      mutate: updateTripMutate,
      isPending: false,
      error: null,
    })
  })

  test('renders listed trip from query data', () => {
    renderTripsPage()
    expect(screen.getByText('Existing Trip')).toBeInTheDocument()
    expect(screen.getByText('Existing description')).toBeInTheDocument()
  })

  test('submits create trip form to mutation', async () => {
    const user = userEvent.setup()
    renderTripsPage()

    const createTitleInput = screen.getByPlaceholderText('Summer Europe Sprint')
    await user.clear(createTitleInput)
    await user.type(createTitleInput, 'Goa Escape')
    await user.click(screen.getByRole('button', { name: /create trip/i }))

    await waitFor(() => {
      expect(createTripMutate).toHaveBeenCalled()
    })

    const [payload] = createTripMutate.mock.calls[0]
    expect(payload).toEqual(
      expect.objectContaining({
        title: 'Goa Escape',
      }),
    )
  })

  test('updates trip title through quick update action', async () => {
    const user = userEvent.setup()
    renderTripsPage()

    const quickUpdateInput = screen.getByDisplayValue('Existing Trip')
    await user.clear(quickUpdateInput)
    await user.type(quickUpdateInput, 'Updated Trip')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(updateTripMutate).toHaveBeenCalledWith({
        tripId: '507f1f77bcf86cd799439015',
        body: {
          title: 'Updated Trip',
        },
      })
    })
  })
})
