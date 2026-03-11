import {
  ArrowRightIcon,
  CalendarCheck2Icon,
  ChartNoAxesCombinedIcon,
  CircleCheckBigIcon,
  CoinsIcon,
  FileStackIcon,
  MessageSquareMoreIcon,
  SparklesIcon,
  UsersRoundIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAuth } from '../app/AuthProvider/index.js'
import { APP_TITLE } from '../config/index.js'
import { Heading, Text } from '../components/typography/index.js'

const FEATURE_PILLARS = [
  {
    id: 'planning',
    title: 'Trip Planning Workspace',
    description: 'Build day-wise itineraries and reorder activities without losing timeline context.',
    icon: CalendarCheck2Icon,
    highlights: ['Trip creation + dates', 'Day timeline + cards', 'Drag reorder workflow'],
  },
  {
    id: 'collaboration',
    title: 'Collaboration Control',
    description: 'Run owner/editor/viewer workflows with invitation and contextual comments.',
    icon: UsersRoundIcon,
    highlights: ['Role-resolved access', 'Invite + acceptance flow', 'Day/activity comments'],
  },
  {
    id: 'organization',
    title: 'Operations + Budget',
    description: 'Track files, reservations, checklists, expenses, settlements, and analytics in one place.',
    icon: CoinsIcon,
    highlights: ['Checklist + attachments', 'Budget + settlements', 'Forecast + report snapshots'],
  },
]

const LIVE_METRICS = [
  {
    label: 'Modules Unified',
    value: '12+',
  },
  {
    label: 'Role-safe Actions',
    value: 'Owner / Editor / Viewer',
  },
  {
    label: 'Core Areas Covered',
    value: 'Planning · Collaboration · Organization · Analytics',
  },
]

const LandingPage = () => {
  const { isAuthenticated } = useAuth()
  const primaryPath = isAuthenticated ? '/trips' : '/register'
  const primaryLabel = isAuthenticated ? 'Open Dashboard' : 'Start Planning'

  return (
    <div className="min-h-screen text-ink">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-layout items-center justify-between px-lg py-md sm:px-xl">
          <Link to="/" className="inline-flex items-center gap-sm">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <SparklesIcon className="size-4" aria-hidden="true" />
            </span>
            <span className="text-body font-semibold tracking-tight">{APP_TITLE}</span>
          </Link>

          <nav className="flex items-center gap-sm">
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="inline-flex items-center rounded-md border border-line bg-panel/80 px-lg py-sm text-body-sm font-medium text-ink transition-colors hover:bg-panel-muted/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                Sign In
              </Link>
            ) : null}
            <Link
              to={primaryPath}
              className="inline-flex items-center gap-xs rounded-md bg-primary px-lg py-sm text-body-sm font-semibold text-ink-inverse transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              {primaryLabel}
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-layout px-lg pb-4xl pt-2xl sm:px-xl sm:pt-3xl">
        <section className="grid gap-xl lg:grid-cols-[1.2fr,0.8fr]">
          <div className="surface-glass rounded-2xl border border-line/80 p-xl sm:p-2xl">
            <Text
              as="p"
              size="caption"
              weight="semibold"
              className="mb-md inline-flex items-center gap-xs rounded-full border border-primary/25 bg-primary/10 px-md py-xs uppercase tracking-[0.12em] text-primary"
            >
              Built For Collaborative Travel Teams
            </Text>

            <Heading level={1} size="display" className="max-w-[15ch]">
              Plan. Collaborate. <span className="text-gradient-primary">Execute.</span>
            </Heading>

            <Text tone="muted" className="mt-md max-w-[60ch]">
              {APP_TITLE} unifies itinerary planning, member roles, files, reservations, and
              budget analytics in one focused workspace for your whole travel team.
            </Text>

            <div className="mt-xl flex flex-wrap gap-sm">
              <Link
                to={primaryPath}
                className="inline-flex items-center gap-xs rounded-md bg-primary px-xl py-md text-body-sm font-semibold text-ink-inverse transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                {primaryLabel}
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-md border border-line bg-panel/80 px-xl py-md text-body-sm font-semibold text-ink transition-colors hover:bg-panel-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                >
                  I already have an account
                </Link>
              ) : null}
            </div>

            <div className="mt-xl grid gap-sm sm:grid-cols-3">
              <div className="rounded-xl border border-line/75 bg-panel/65 p-md">
                <Text size="caption" className="mb-2xs text-primary">
                  Core Planning
                </Text>
                <Text size="body-sm" tone="muted">
                  Trips, days, activity cards, reordering
                </Text>
              </div>
              <div className="rounded-xl border border-line/75 bg-panel/65 p-md">
                <Text size="caption" className="mb-2xs text-primary">
                  Team Controls
                </Text>
                <Text size="body-sm" tone="muted">
                  Invitation, role policy, comments
                </Text>
              </div>
              <div className="rounded-xl border border-line/75 bg-panel/65 p-md">
                <Text size="caption" className="mb-2xs text-primary">
                  Ops Analytics
                </Text>
                <Text size="body-sm" tone="muted">
                  Budget, settlement, forecasting reports
                </Text>
              </div>
            </div>
          </div>

          <aside className="surface-glass rounded-2xl border border-line/80 p-lg sm:p-xl">
            <div className="flex items-center justify-between">
              <Heading level={2} size="title-sm">
                Live Workspace Snapshot
              </Heading>
              <ChartNoAxesCombinedIcon className="size-5 text-primary" aria-hidden="true" />
            </div>

            <Text tone="muted" size="body-sm" className="mt-xs">
              A shared trip space where planning, updates, and decisions stay in sync.
            </Text>

            <div className="mt-lg space-y-sm">
              {LIVE_METRICS.map((metric) => (
                <article
                  key={metric.label}
                  className="rounded-lg border border-line/75 bg-panel/70 p-md"
                >
                  <Text size="caption" tone="muted">
                    {metric.label}
                  </Text>
                  <Text as="p" weight="semibold" className="mt-xs">
                    {metric.value}
                  </Text>
                </article>
              ))}
            </div>

            <div className="mt-lg rounded-lg border border-primary/25 bg-primary/10 p-md">
              <Text size="caption" weight="semibold" className="text-primary">
                Included Flows
              </Text>
              <ul className="mt-sm space-y-xs">
                <li className="flex items-start gap-xs text-body-sm text-ink-muted">
                  <CircleCheckBigIcon className="mt-2xs size-4 shrink-0 text-primary" />
                  Invitation acceptance + role sync
                </li>
                <li className="flex items-start gap-xs text-body-sm text-ink-muted">
                  <CircleCheckBigIcon className="mt-2xs size-4 shrink-0 text-primary" />
                  Budget summaries + settlement reports
                </li>
                <li className="flex items-start gap-xs text-body-sm text-ink-muted">
                  <CircleCheckBigIcon className="mt-2xs size-4 shrink-0 text-primary" />
                  Export-ready analytics snapshots
                </li>
              </ul>
            </div>
          </aside>
        </section>

        <section className="mt-3xl">
          <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
            <div>
              <Heading level={2}>Platform Capability Map</Heading>
              <Text tone="muted" className="mt-xs">
                Modular architecture designed to scale from one trip to operational trip programs.
              </Text>
            </div>
            <Link
              to={primaryPath}
              className="inline-flex items-center gap-xs text-body-sm font-semibold text-primary hover:underline"
            >
              Explore workspace
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>

          <div className="grid gap-md md:grid-cols-3">
            {FEATURE_PILLARS.map((pillar) => {
              const Icon = pillar.icon
              return (
                <article
                  key={pillar.id}
                  className="surface-glass rounded-xl border border-line/80 p-lg"
                >
                  <span className="mb-md inline-flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <Heading level={3} size="title-sm">
                    {pillar.title}
                  </Heading>
                  <Text tone="muted" size="body-sm" className="mt-xs">
                    {pillar.description}
                  </Text>
                  <ul className="mt-md space-y-xs">
                    {pillar.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-xs text-body-sm text-ink-muted">
                        <CircleCheckBigIcon className="mt-2xs size-4 shrink-0 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              )
            })}
          </div>
        </section>

        <section className="mt-3xl rounded-2xl border border-line/80 bg-panel/75 p-xl sm:p-2xl">
          <div className="grid gap-lg md:grid-cols-[1.15fr,0.85fr]">
            <div>
              <Heading level={2} className="max-w-[20ch]">
                Ready to run end-to-end trip operations?
              </Heading>
              <Text tone="muted" className="mt-sm max-w-[60ch]">
                Start with secure authentication, then manage planning, collaboration, and budget
                execution from one dashboard.
              </Text>
              <div className="mt-lg flex flex-wrap gap-sm">
                <Link
                  to={primaryPath}
                  className="inline-flex items-center rounded-md bg-primary px-xl py-md text-body-sm font-semibold text-ink-inverse transition-colors hover:bg-primary/90"
                >
                  {primaryLabel}
                </Link>
                {!isAuthenticated ? (
                  <Link
                    to="/login"
                    className="inline-flex items-center rounded-md border border-line px-xl py-md text-body-sm font-semibold text-ink hover:bg-panel-muted/75"
                  >
                    Sign in
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="grid gap-sm sm:grid-cols-2 md:grid-cols-1">
              <div className="rounded-xl border border-line/75 bg-panel/75 p-md">
                <div className="mb-xs inline-flex size-8 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <MessageSquareMoreIcon className="size-4" />
                </div>
                <Text as="p" weight="semibold">
                  Discussion-first workflow
                </Text>
                <Text tone="muted" size="body-sm" className="mt-2xs">
                  Keep day-level and activity-level comments attached to planning context.
                </Text>
              </div>
              <div className="rounded-xl border border-line/75 bg-panel/75 p-md">
                <div className="mb-xs inline-flex size-8 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <FileStackIcon className="size-4" />
                </div>
                <Text as="p" weight="semibold">
                  Evidence-ready records
                </Text>
                <Text tone="muted" size="body-sm" className="mt-2xs">
                  Store files, reservations, and report snapshots for operations and audit trails.
                </Text>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default LandingPage
