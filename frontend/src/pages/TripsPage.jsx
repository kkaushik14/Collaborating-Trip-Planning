import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { FormMessage, RHFTextField } from '../components/forms/index.js'
import { useCreateTrip, useTrips, useUpdateTrip } from '../hooks/index.js'
import { Button, Input } from '../components/ui/index.js'
import { Heading, Text } from '../components/typography/index.js'
import { tripCreateSchema } from '../validators/index.js'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
  PageForm,
} from './PageStates.jsx'
import { canEditTripContent, formatDateLabel, normalizeActorRole, toDateInputValue } from './tripPageUtils.js'

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
    return {
      totalTrips: trips.length,
      totalTravelers,
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
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  const handleTripCreate = (values) => {
    if (createTripMutation.isPending) return
    const { currency, timezone, ...details } = values
    createTripMutation.mutate({ ...details, settings: { currency, timezone } }, {
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
    if (!canEditTripContent(trip.actorRole) || updateTripMutation.isPending) return
    const nextTitle = String(tripDrafts[trip._id] ?? trip.title ?? '').trim()
    if (nextTitle.length < 3 || nextTitle.length > 120 || nextTitle === trip.title) {
      return
    }

    updateTripMutation.mutate(
      { tripId: trip._id, body: { title: nextTitle } },
      {
        onSuccess: () => setTripDrafts((previous) => {
          const next = { ...previous }
          delete next[trip._id]
          return next
        }),
      },
    )
  }

  if (tripsQuery.isPending) {
    return (
      <PageLoadingState
        title="Loading trips..."
        description="Fetching your trips."
      />
    )
  }

  if (tripsQuery.error) {
    return (
      <PageErrorState
        title="Unable to load trips"
        description="We could not load your trips right now."
        errorMessage={tripsQuery.error?.message}
        onRetry={() => tripsQuery.refetch()}
      />
    )
  }

  if (!trips.length) {
    return (
      <section className="min-w-0 max-w-full space-y-lg">
        <Heading level={1} size="title">My Trips</Heading>
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
    <section className="min-w-0 max-w-full space-y-lg">
      <header className="space-y-xs">
        <Heading level={1} size="title">
          My Trips
        </Heading>
        <Text tone="muted">
          Select a trip to open planning, collaboration, organization, and analytics views.
        </Text>
      </header>

      <section className="grid gap-sm sm:grid-cols-2">
        <article className="min-w-0 break-words rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Trips</p>
          <p className="mt-2xs text-title font-semibold text-ink">{summary.totalTrips}</p>
        </article>
        <article className="min-w-0 break-words rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Travelers</p>
          <p className="mt-2xs text-title font-semibold text-ink">{summary.totalTravelers}</p>
        </article>
      </section>

      <CreateTripSection
        tripForm={tripForm}
        onSubmit={handleTripCreate}
        mutationError={createTripMutation.error?.message}
        isSubmitting={createTripMutation.isPending}
      />

      {updateTripMutation.error ? (
        <PageErrorState title="Title update failed" description="Your title was not saved. Keep your changes and try Save again." errorMessage={updateTripMutation.error.message} />
      ) : null}

      <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-3">
        {trips.map((trip) => (
          <article
            key={trip._id}
            className="flex min-w-0 h-full flex-col break-words rounded-xl border border-line bg-panel p-md shadow-card sm:p-lg"
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
              <p>Role: {normalizeActorRole(trip.actorRole)}</p>
            </div>

            {canEditTripContent(trip.actorRole) ? (
              <div className="mt-md space-y-xs rounded-md border border-line bg-panel-muted p-sm">
                <label htmlFor={`trip-title-${trip._id}`} className="text-caption text-ink-muted">
                  Quick update title
                </label>
                <div className="flex gap-xs">
                  <Input
                    id={`trip-title-${trip._id}`}
                    className="min-w-0"
                    disabled={updateTripMutation.isPending}
                    maxLength={120}
                    value={tripDrafts[trip._id] ?? trip.title ?? ''}
                    onChange={(event) => updateDraftValue(trip._id, event.target.value)}
                    placeholder="Trip title"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updateTripMutation.isPending || String(tripDrafts[trip._id] ?? trip.title ?? '').trim().length < 3 || String(tripDrafts[trip._id] ?? trip.title ?? '').trim() === trip.title}
                    onClick={() => handleQuickUpdate(trip)}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="mt-lg grid gap-xs">
              <Button render={<Link to={`/trips/${trip._id}/planning`} />} nativeButton={false} role="link" size="sm" className="w-full">
                Open Trip
              </Button>

              <div className="grid grid-cols-2 gap-xs">
                <Button render={<Link to={`/trips/${trip._id}/collaboration`} />} nativeButton={false} role="link" size="sm" variant="outline" className="w-full">
                  Team
                </Button>
                <Button render={<Link to={`/trips/${trip._id}/organization`} />} nativeButton={false} role="link" size="sm" variant="outline" className="w-full">
                  Budget
                </Button>
              </div>
              <Button render={<Link to={`/trips/${trip._id}/analytics`} />} nativeButton={false} role="link" size="sm" variant="outline" className="w-full">
                Analytics
              </Button>
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
  <article className="min-w-0 break-words rounded-xl border border-line bg-panel p-md shadow-card sm:p-lg">
    <header className="space-y-xs">
      <Heading level={2} size="title-sm">
        Create New Trip
      </Heading>
      <Text tone="muted" size="body-sm">
        Start a new trip with basic details and invite your travelers later.
      </Text>
    </header>

    <PageForm
      methods={tripForm}
      disabled={isSubmitting}
      onSubmit={onSubmit}
      persistKey="trips:create"
      className="mt-md grid gap-md md:grid-cols-2"
    >
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
    </PageForm>
  </article>
)

export default TripsPage
