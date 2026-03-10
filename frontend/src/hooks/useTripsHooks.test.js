import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'

import { createTrip, listTrips, updateTrip } from '../services/index.js'
import { useCreateTrip, useTrips, useUpdateTrip } from './useTripsHooks.js'

jest.mock('../services/index.js', () => ({
  createTrip: jest.fn(),
  listTrips: jest.fn(),
  updateTrip: jest.fn(),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useTripsHooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('useTrips fetches and returns list data', async () => {
    listTrips.mockResolvedValueOnce({
      trips: [{ _id: '507f1f77bcf86cd799439011', title: 'Iceland' }],
    })

    const { result } = renderHook(() => useTrips(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(listTrips).toHaveBeenCalledWith({ query: {} })
    expect(result.current.data?.trips).toHaveLength(1)
  })

  test('useCreateTrip triggers createTrip mutation', async () => {
    createTrip.mockResolvedValueOnce({
      trip: { _id: '507f1f77bcf86cd799439012', title: 'Japan' },
    })

    const { result } = renderHook(() => useCreateTrip(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate({
        title: 'Japan',
        startDate: '2026-04-01',
        endDate: '2026-04-05',
        travelerCount: 2,
        currency: 'USD',
      })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(createTrip).toHaveBeenCalledTimes(1)
  })

  test('useUpdateTrip forwards tripId and body', async () => {
    updateTrip.mockResolvedValueOnce({
      trip: { _id: '507f1f77bcf86cd799439013', title: 'Updated title' },
    })

    const { result } = renderHook(() => useUpdateTrip(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate({
        tripId: '507f1f77bcf86cd799439013',
        body: { title: 'Updated title' },
      })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(updateTrip).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439013',
      { title: 'Updated title' },
      {},
    )
  })
})
