import { ArrowRightIcon, CameraIcon, CpuIcon, GlobeIcon, PaletteIcon, QuoteIcon, SparklesIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAuth } from '../app/AuthProvider/index.js'
import { SiteFooter } from '../components/common/index.js'
import { APP_TITLE } from '../config/site.js'
import { useScrollReveal } from '../hooks/index.js'

const PARTNER_LOGOS = ['Trips', 'Itinerary', 'Activities', 'Invites', 'Comments', 'Budget', 'Reports']

const CAPABILITY_CARDS = [
  {
    id: 'web',
    title: 'Trip Planning',
    description:
      'Create trips, build day-wise itineraries, add activity cards, and reorder plans in seconds.',
    icon: GlobeIcon,
  },
  {
    id: 'brand',
    title: 'Collaboration',
    description:
      'Invite members, assign Owner/Editor/Viewer roles, and keep decisions synced through comments.',
    icon: PaletteIcon,
  },
]

const FEATURE_MOSAIC = [
  {
    id: 'ai',
    title: 'Organization',
    description: 'Manage checklists, files, and manual reservations without breaking planning flow.',
    icon: CpuIcon,
  },
  {
    id: 'hub',
    title: 'One Workspace for the Whole Journey',
    description: 'Planning, collaboration, organization, and analytics in one shared command center.',
    icon: SparklesIcon,
    center: true,
  },
  {
    id: 'motion',
    title: 'Budget & Insights',
    description: 'Track expenses, review summaries, and monitor trends to stay ahead of total cost.',
    icon: CameraIcon,
    wide: true,
  },
]

const HeroVisual = () => (
  <div className="hover-lift relative mx-auto w-full max-w-[32rem]">
    <div className="relative aspect-[1.12/1] rounded-[2rem] border border-line/65 bg-panel/70 p-lg shadow-card">
      <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_65%_35%,rgb(var(--color-warning)/0.24),transparent_55%),radial-gradient(circle_at_25%_70%,rgb(var(--color-neutral)/0.42),transparent_58%)]" />
      <div className="absolute inset-[10%] rounded-[1.5rem] border border-line/75 bg-canvas/90 shadow-[inset_0_0_0_1px_rgb(var(--color-ink)/0.06)]" />
      <div className="absolute inset-[17%] rounded-[1.15rem] border border-line/70 bg-gradient-to-br from-panel via-panel-muted to-canvas p-md">
        <div className="h-full rounded-xl border border-line/60 bg-[radial-gradient(circle_at_75%_20%,rgb(var(--color-warning)/0.38),transparent_52%),linear-gradient(150deg,rgb(var(--color-panel-muted)/0.88),rgb(var(--color-canvas)/0.95))]" />
      </div>
      <div className="absolute right-[14%] top-[18%] h-2 w-2 rounded-full bg-warning shadow-[0_0_0_8px_rgb(var(--color-warning)/0.16)]" />
      <div className="absolute left-[13%] top-[25%] h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_0_6px_rgb(var(--color-primary)/0.14)]" />
      <div className="absolute bottom-[12%] right-[18%] h-20 w-20 rounded-full border border-line/55 bg-panel/60 blur-[1px]" />
    </div>
  </div>
)

const CTAButtons = ({ primaryPath, isAuthenticated }) => (
  <div className="mt-xl flex flex-wrap items-center gap-md">
    <Link
      to={primaryPath}
      className="inline-flex items-center rounded-full border border-warning/70 bg-gradient-to-r from-[#be6a45] to-[#d18a5a] px-xl py-sm text-body-sm font-semibold text-ink-inverse shadow-[0_8px_28px_rgb(var(--color-warning)/0.28)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/40"
    >
      {isAuthenticated ? 'Open Trips' : 'Create Account'}
    </Link>
    <Link
      to={isAuthenticated ? '/trips' : '/login'}
      className="inline-flex items-center gap-xs text-body-sm font-semibold text-ink transition-colors hover:text-warning"
    >
      {isAuthenticated ? 'Go to Dashboard' : 'Explore Features'}
      <ArrowRightIcon className="size-4" aria-hidden="true" />
    </Link>
  </div>
)

const LandingPage = () => {
  const { isAuthenticated } = useAuth()
  const primaryPath = isAuthenticated ? '/trips' : '/register'
  useScrollReveal()

  return (
    <div className="landing-page min-h-screen text-ink">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-layout items-center justify-between px-lg py-md sm:px-xl">
          <Link to="/" className="inline-flex items-center gap-sm">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <p className='text-[#be6a45] font-bold'>CTP</p>
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
              className="inline-flex items-center gap-xs rounded-md bg-[#be6a45] px-lg py-sm text-body-sm font-semibold text-ink-inverse transition-colors hover:bg-[#d18a5a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              {isAuthenticated ? 'Open Dashboard' : 'Start Planning'}
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgb(var(--color-line)/0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--color-line)/0.12)_1px,transparent_1px)] [background-size:4.5rem_4.5rem]" />
          <div className="floating-glow absolute -top-32 left-[12%] h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-[130px]" />
          <div className="floating-glow absolute top-40 right-[10%] h-[24rem] w-[24rem] rounded-full bg-warning/20 blur-[125px]" />
          <div className="floating-glow absolute bottom-10 left-[22%] h-[20rem] w-[20rem] rounded-full bg-neutral/30 blur-[120px]" />
        </div>

        <section data-reveal className="mx-auto max-w-layout px-lg pb-xl pt-2xl sm:px-xl sm:pt-3xl">
          <div className="grid items-center gap-2xl lg:grid-cols-[1fr,0.95fr]">
            <div className="max-w-[34rem]">
              <p className="mb-lg inline-flex items-center gap-xs rounded-full border border-line/65 bg-panel/70 px-md py-xs text-caption text-ink-muted">
                <span className="size-2 rounded-full bg-warning" />
                Built for teams planning trips together
              </p>
              <h1 className="break-words text-display font-semibold leading-[1.06] tracking-tight text-ink">
                Plan Better
                <br />
                Trips Together
              </h1>
              <p className="mt-lg max-w-[38ch] text-title-sm leading-relaxed text-ink-muted">
                Create day-wise itineraries, invite collaborators with clear roles, and manage
                files, reservations, and budgets in one shared workspace.
              </p>
              <CTAButtons primaryPath={primaryPath} isAuthenticated={isAuthenticated} />
            </div>
            <HeroVisual />
          </div>
        </section>

        <section data-reveal className="mx-auto max-w-layout px-lg pb-3xl sm:px-xl">
          <div className="grid grid-cols-2 gap-md rounded-2xl border border-line/60 bg-canvas/35 px-lg py-md text-ink-muted sm:grid-cols-4 lg:grid-cols-7">
            {PARTNER_LOGOS.map((logo) => (
              <p key={logo} className="text-center text-body-sm font-semibold tracking-wide opacity-85">
                {logo}
              </p>
            ))}
          </div>
        </section>

        <section data-reveal className="mx-auto max-w-layout px-lg pb-3xl sm:px-xl">
          <div className="mx-auto max-w-[56rem] text-center">
            <h2 className="break-words text-display font-semibold tracking-tight text-ink">
              Everything your trip team needs
            </h2>
            <p className="mx-auto mt-md max-w-[46ch] text-title-sm text-ink-muted">
              From itinerary planning to expense analytics, organize every trip phase with one
              focused platform.
            </p>
            <div className="mt-lg flex justify-center">
              <CTAButtons primaryPath={primaryPath} isAuthenticated={isAuthenticated} />
            </div>
          </div>

          <div className="mt-2xl grid gap-lg lg:grid-cols-[1.25fr,0.75fr]">
            {CAPABILITY_CARDS.map((card, index) => {
              const Icon = card.icon
              return (
                <article
                  key={card.id}
                  className={[
                    'hover-lift group relative overflow-hidden rounded-2xl border border-line/60 p-xl shadow-card',
                    index === 0 ? 'bg-panel/80' : 'bg-canvas/75',
                  ].join(' ')}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_70%,rgb(var(--color-neutral)/0.34),transparent_58%),radial-gradient(circle_at_80%_20%,rgb(var(--color-warning)/0.2),transparent_52%)] opacity-85 transition duration-300 group-hover:opacity-100" />
                  <div className="relative z-10 max-w-[28rem]">
                    <Icon className="size-5 text-ink-muted" />
                    <h3 className="mt-md text-title font-semibold text-ink">{card.title}</h3>
                    <p className="mt-sm text-body text-ink-muted">{card.description}</p>
                    <Link
                      to={primaryPath}
                      className="mt-lg inline-flex items-center gap-xs text-body-sm font-semibold text-ink-muted transition hover:text-ink"
                    >
                      See More
                      <ArrowRightIcon className="size-4" />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section data-reveal className="mx-auto max-w-layout px-lg pb-3xl sm:px-xl">
          <div className="grid gap-lg lg:grid-cols-3">
            {FEATURE_MOSAIC.map((item) => {
              const Icon = item.icon
              return (
                <article
                  key={item.id}
                  className={[
                    'hover-lift group relative overflow-hidden rounded-2xl border border-line/60 bg-panel/75 p-xl shadow-card',
                    item.wide ? 'lg:col-span-2' : '',
                  ].join(' ')}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgb(var(--color-primary)/0.32),transparent_58%),radial-gradient(circle_at_20%_25%,rgb(var(--color-neutral)/0.28),transparent_52%)] transition duration-300 group-hover:opacity-90" />
                  <div className="relative z-10">
                    <Icon className="size-5 text-ink-muted" />
                    <h3 className="mt-md text-display font-semibold leading-[1.08] text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-sm max-w-[35ch] text-body text-ink-muted">{item.description}</p>
                    <Link
                      to={primaryPath}
                      className="mt-lg inline-flex items-center gap-xs text-body-sm font-semibold text-ink-muted transition hover:text-ink"
                    >
                      See More
                      <ArrowRightIcon className="size-4" />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section data-reveal className="mx-auto max-w-layout px-lg pb-3xl sm:px-xl">
          <div className="mx-auto max-w-[56rem] text-center">
            <h2 className="break-words text-display font-semibold tracking-tight text-ink">
              Built for real travel workflows
            </h2>
            <p className="mt-md text-title-sm text-ink-muted">
              Teams use this workspace to coordinate complex trips without losing context, ownership,
              or budget visibility.
            </p>
            <div className="mt-lg flex justify-center">
              <CTAButtons primaryPath={primaryPath} isAuthenticated={isAuthenticated} />
            </div>
          </div>
          <div className="mt-2xl grid gap-lg lg:grid-cols-[1.15fr,0.85fr]">
            <article className="hover-lift rounded-2xl border border-line/60 bg-panel/85 p-xl shadow-card">
              <p className="text-caption uppercase tracking-[0.12em] text-ink-muted">
                Sample Workspace
              </p>
              <h3 className="mt-md break-words text-display font-semibold leading-[1.04] text-ink">
                From Chaos
                <br />
                to Clear Itinerary
              </h3>
              <div className="mt-lg h-48 rounded-xl border border-line/60 bg-[linear-gradient(135deg,rgb(var(--color-panel-muted)),rgb(var(--color-primary)/0.4))]" />
            </article>
            <article className="hover-lift rounded-2xl border border-line/60 bg-canvas/75 p-xl shadow-card">
              <p className="text-title-sm font-semibold tracking-tight text-neutral">Member Roles</p>
              <p className="mt-xl text-title-sm leading-relaxed text-ink-muted">
                Owner controls strategy. Editors execute updates. Viewers stay informed with full
                context and zero confusion.
              </p>
            </article>
          </div>
        </section>

        <section data-reveal className="mx-auto max-w-layout px-lg pb-3xl sm:px-xl">
          <article className="hover-lift relative overflow-hidden rounded-2xl border border-line/60 bg-panel/75 px-xl py-2xl shadow-card sm:px-2xl sm:py-3xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgb(var(--color-neutral)/0.3),transparent_50%),radial-gradient(circle_at_75%_20%,rgb(var(--color-primary)/0.25),transparent_58%)]" />
            <div className="relative z-10 mx-auto max-w-[54rem] text-center">
              <QuoteIcon className="mx-auto mb-md size-8 text-ink-muted/75" />
              <p className="text-title leading-relaxed text-ink">
                This platform helped our team coordinate itinerary updates, member responsibilities,
                and budget tracking without chasing messages across multiple tools.
              </p>
              <div className="mx-auto mt-xl inline-flex items-center gap-sm rounded-full border border-line/75 bg-canvas/45 px-lg py-sm">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-panel-muted text-body-sm font-semibold text-ink">
                  TK
                </span>
                <div className="text-left">
                  <p className="text-body font-semibold text-ink">Travel Team Lead</p>
                  <p className="text-caption uppercase tracking-[0.12em] text-ink-muted">
                    Coordinated Group Departure
                  </p>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section data-reveal className="mx-auto max-w-layout px-lg pb-3xl sm:px-xl">
          <div className="hover-lift grid items-center gap-xl rounded-2xl border border-line/60 bg-canvas/75 p-xl shadow-card lg:grid-cols-[1fr,0.95fr]">
            <div>
              <h2 className="break-words text-display font-semibold leading-[1.04] tracking-tight text-ink">
                Ready to plan
                <br />
                your next trip?
              </h2>
              <p className="mt-md max-w-[34ch] text-title-sm text-ink-muted">
                Start with one trip, invite your team, and turn planning into a calm, shared
                workflow.
              </p>
              <CTAButtons primaryPath={primaryPath} isAuthenticated={isAuthenticated} />
            </div>
            <HeroVisual />
          </div>
        </section>
      </main>

      <SiteFooter mode="marketing" />

      <aside className="fixed right-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-xl border border-line/60 bg-canvas/80 px-sm py-lg text-caption font-semibold uppercase tracking-[0.18em] text-ink-muted lg:block [writing-mode:vertical-rl]">
        Trip Ready
      </aside>
    </div>
  )
}

export default LandingPage
