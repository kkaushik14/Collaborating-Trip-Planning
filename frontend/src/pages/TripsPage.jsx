import { Link } from 'react-router-dom'

import { useTrips } from '../hooks/index.js'
import { Button } from '../components/ui/index.js'
import { Heading, Text } from '../components/typography/index.js'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from './PageStates.jsx'
import { formatDateLabel } from './tripPageUtils.js'

const TripsPage = () => {
  const tripsQuery = useTrips()
  const trips = tripsQuery.data?.trips || []

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
      <PageEmptyState
        title="No trips found"
        description="Create your first trip from API or mock backend and it will appear here."
      />
    )
  }

  return (
    <section className="space-y-lg">
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
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default TripsPage
