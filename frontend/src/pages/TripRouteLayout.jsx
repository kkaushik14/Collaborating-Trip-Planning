import { NavLink, Outlet, useParams } from 'react-router-dom'

import { useTrip } from '../hooks/index.js'
import { Heading, Text } from '../components/typography/index.js'
import { PageErrorState, PageLoadingState } from './PageStates.jsx'
import { mapTripSummary } from './tripPageUtils.js'

const TRIP_ROUTE_LINKS = Object.freeze([
  { to: 'planning', label: 'Planning' },
  { to: 'collaboration', label: 'Collaboration' },
  { to: 'organization', label: 'Organization' },
  { to: 'analytics', label: 'Analytics' },
])

const TripRouteLayout = () => {
  const { tripId } = useParams()
  const tripQuery = useTrip({ tripId })

  if (tripQuery.isPending) {
    return (
      <PageLoadingState
        title="Loading trip context..."
        description="Fetching trip metadata before opening feature sections."
      />
    )
  }

  if (tripQuery.error || !tripQuery.data?.trip) {
    return (
      <PageErrorState
        title="Trip not available"
        description="Trip details could not be loaded for this route."
        errorMessage={tripQuery.error?.message}
        onRetry={() => tripQuery.refetch()}
      />
    )
  }

  const trip = tripQuery.data.trip
  const tripSummary = mapTripSummary(trip)

  return (
    <div className="space-y-lg">
      <section className="rounded-xl border border-line bg-panel p-md shadow-card sm:p-lg">
        <div className="space-y-sm">
          <div className="space-y-xs">
            <Heading level={1} size="title">
              {tripSummary.title}
            </Heading>
            <Text tone="muted" className="break-words">
              {tripSummary.dateRangeLabel} · {tripSummary.travelerCount} traveler(s)
            </Text>
          </div>

          <nav className="overflow-x-auto" aria-label="Trip feature navigation">
            <div className="inline-flex min-w-full gap-xs rounded-lg bg-panel-muted p-xs sm:min-w-0">
              {TRIP_ROUTE_LINKS.map((routeLink) => (
                <NavLink
                  key={routeLink.to}
                  to={routeLink.to}
                  className={({ isActive }) =>
                    [
                      'rounded-md px-md py-sm text-body-sm font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                      isActive
                        ? 'bg-panel text-ink shadow-sm'
                        : 'text-ink-muted hover:bg-panel hover:text-ink',
                    ].join(' ')
                  }
                >
                  {routeLink.label}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      </section>

      <Outlet context={{ tripId, trip }} />
    </div>
  )
}

export default TripRouteLayout
