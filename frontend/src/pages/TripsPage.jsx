import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { Form, FormMessage, RHFTextField } from '../components/forms/index.js'
import { useCreateTrip, useTrips, useUpdateTrip } from '../hooks/index.js'
import { Button, Input } from '../components/ui/index.js'
import { Heading, Text } from '../components/typography/index.js'
import { tripCreateSchema } from '../validators/index.js'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from './PageStates.jsx'
import { formatCurrency, formatDateLabel } from './tripPageUtils.js'

const toDateInputValue = (date) => date.toISOString().slice(0, 10)
const EMPTY_TRIPS = []

const TripsPage = () => {
  const tripsQuery = useTrips()
  const trips = tripsQuery.data?.trips ?? EMPTY_TRIPS
  const createTripMutation = useCreateTrip()
  const updateTripMutation = useUpdateTrip()
  const [tripDrafts, setTripDrafts] = useState({})
  const summary = useMemo(() => {
    const totalTravelers = trips.reduce(
      (count, trip) => count + Number(trip.travelerCount || 0),
      0,
    )
    const totalBudget = trips.reduce(
      (sum, trip) => sum + Number(trip.totalBudget || 0),
      0,
    )

    return {
      totalTrips: trips.length,
      totalTravelers,
      totalBudget,
      currency: trips[0]?.currency || 'USD',
    }
  }, [trips])

  const defaultDates = useMemo(() => {
    const now = new Date()
    const end = new Date(now.getTime())
    end.setDate(end.getDate() + 4)

    return {
      startDate: toDateInputValue(now),
      endDate: toDateInputValue(end),
    }
  }, [])

  const tripForm = useForm({
    resolver: zodResolver(tripCreateSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: defaultDates.startDate,
      endDate: defaultDates.endDate,
      travelerCount: 2,
      currency: 'USD',
      timezone: 'Asia/Kolkata',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  const handleTripCreate = (values) => {
    createTripMutation.mutate(values, {
      onSuccess: () => {
        tripForm.reset({
          ...values,
          title: '',
          description: '',
        })
      },
    })
  }

  const updateDraftValue = (tripId, value) => {
    setTripDrafts((previous) => ({
      ...previous,
      [tripId]: value,
    }))
  }

  const handleQuickUpdate = (trip) => {
    const nextTitle = String(tripDrafts[trip._id] ?? trip.title ?? '').trim()
    if (!nextTitle || nextTitle === trip.title) {
      return
    }

    updateTripMutation.mutate({
      tripId: trip._id,
      body: {
        title: nextTitle,
      },
    })
  }

  if (tripsQuery.isPending) {
    return (
      <PageLoadingState
        title="Loading trips..."
        description="Fetching your trip list and collaboration metadata."
      />
    )
  }

  if (tripsQuery.error) {
    return (
      <PageErrorState
        title="Unable to load trips"
        description="Trips could not be fetched from the API."
        errorMessage={tripsQuery.error?.message}
        onRetry={() => tripsQuery.refetch()}
      />
    )
  }

  if (!trips.length) {
    return (
      <section className="space-y-lg">
        <CreateTripSection
          tripForm={tripForm}
          onSubmit={handleTripCreate}
          mutationError={createTripMutation.error?.message}
          isSubmitting={createTripMutation.isPending}
        />
        <PageEmptyState
          title="No trips found"
          description="Create your first trip using the form above."
        />
      </section>
    )
  }

  return (
    <section className="space-y-lg">
      <section className="grid gap-sm sm:grid-cols-3">
        <article className="rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Trips</p>
          <p className="mt-2xs text-title font-semibold text-ink">{summary.totalTrips}</p>
        </article>
        <article className="rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Travelers</p>
          <p className="mt-2xs text-title font-semibold text-ink">{summary.totalTravelers}</p>
        </article>
        <article className="rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Budget (Declared)</p>
          <p className="mt-2xs text-title font-semibold text-ink">
            {formatCurrency(summary.totalBudget, summary.currency)}
          </p>
        </article>
      </section>

      <CreateTripSection
        tripForm={tripForm}
        onSubmit={handleTripCreate}
        mutationError={createTripMutation.error?.message}
        isSubmitting={createTripMutation.isPending}
      />

      <header className="space-y-xs">
        <Heading level={1} size="title">
          My Trips
        </Heading>
        <Text tone="muted">
          Select a trip to open planning, collaboration, organization, and analytics views.
        </Text>
      </header>

      <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-3">
        {trips.map((trip) => (
          <article
            key={trip._id}
            className="flex h-full flex-col rounded-xl border border-line bg-panel p-lg shadow-card"
          >
            <div className="space-y-xs">
              <Heading level={2} size="title-sm">
                {trip.title || 'Untitled Trip'}
              </Heading>
              <Text tone="muted" size="body-sm">
                {trip.description || 'No description yet.'}
              </Text>
            </div>

            <div className="mt-md space-y-2xs text-caption text-ink-muted">
              <p>{formatDateLabel(trip.startDate)} - {formatDateLabel(trip.endDate)}</p>
              <p>{Number(trip.travelerCount || 0)} traveler(s)</p>
              <p>Role: {trip.actorRole || 'MEMBER'}</p>
            </div>

            <div className="mt-md space-y-xs rounded-md border border-line bg-panel-muted p-sm">
              <Text size="caption" tone="muted">
                Quick update title
              </Text>
              <div className="flex gap-xs">
                <Input
                  value={tripDrafts[trip._id] ?? trip.title ?? ''}
                  onChange={(event) => updateDraftValue(trip._id, event.target.value)}
                  placeholder="Trip title"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={updateTripMutation.isPending}
                  onClick={() => handleQuickUpdate(trip)}
                >
                  Save
                </Button>
              </div>
            </div>

            <div className="mt-lg grid gap-xs">
              <Link to={`/trips/${trip._id}/planning`} className="w-full">
                <Button size="sm" className="w-full">
                  Open Trip
                </Button>
              </Link>

              <div className="grid grid-cols-2 gap-xs">
                <Link to={`/trips/${trip._id}/collaboration`} className="w-full">
                  <Button size="sm" variant="outline" className="w-full">
                    Team
                  </Button>
                </Link>
                <Link to={`/trips/${trip._id}/organization`} className="w-full">
                  <Button size="sm" variant="outline" className="w-full">
                    Budget
                  </Button>
                </Link>
              </div>
              <Link to={`/trips/${trip._id}/analytics`} className="w-full">
                <Button size="sm" variant="outline" className="w-full">
                  Analytics
                </Button>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

const CreateTripSection = ({
  tripForm,
  onSubmit,
  mutationError,
  isSubmitting,
}) => (
  <article className="rounded-xl border border-line bg-panel p-lg shadow-card">
    <header className="space-y-xs">
      <Heading level={2} size="title-sm">
        Create New Trip
      </Heading>
      <Text tone="muted" size="body-sm">
        This form directly calls backend `POST /api/v1/trips`.
      </Text>
    </header>

    <Form methods={tripForm} onSubmit={onSubmit} className="mt-md grid gap-md md:grid-cols-2">
      <RHFTextField
        name="title"
        label="Title"
        required
        placeholder="Summer Europe Sprint"
      />
      <RHFTextField
        name="travelerCount"
        label="Travelers"
        type="number"
        required
      />
      <RHFTextField
        name="startDate"
        label="Start Date"
        type="date"
        required
      />
      <RHFTextField
        name="endDate"
        label="End Date"
        type="date"
        required
      />
      <RHFTextField
        name="currency"
        label="Currency"
        required
        placeholder="USD"
      />
      <RHFTextField
        name="timezone"
        label="Timezone"
        required
        placeholder="Asia/Kolkata"
      />
      <div className="md:col-span-2">
        <RHFTextField
          name="description"
          label="Description"
          placeholder="Short trip summary..."
        />
      </div>

      {mutationError ? (
        <div className="md:col-span-2">
          <FormMessage>{mutationError}</FormMessage>
        </div>
      ) : null}

      <div className="md:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Trip...' : 'Create Trip'}
        </Button>
      </div>
    </Form>
  </article>
)

export default TripsPage
