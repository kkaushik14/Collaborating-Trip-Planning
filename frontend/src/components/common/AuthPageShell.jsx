import {
  LockKeyholeIcon,
  MoveRightIcon,
  RouteIcon,
  ShieldCheckIcon,
  WalletCardsIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { APP_TITLE } from '@/config/site.js'
import { Heading, Text } from '@/components/typography/index.js'

const VALUE_POINTS = [
  {
    id: 'secure',
    title: 'Secure Session Flow',
    description: 'Access + refresh token strategy integrated with protected route guards.',
    icon: ShieldCheckIcon,
  },
  {
    id: 'planning',
    title: 'Live Planning Sync',
    description: 'Trips, days, activities, and collaboration actions stay role-aware in real time.',
    icon: RouteIcon,
  },
  {
    id: 'budget',
    title: 'Budget and Reports',
    description: 'Expenses, settlements, and report snapshots are connected to your trip workspace.',
    icon: WalletCardsIcon,
  },
]

function AuthPageShell({
  panelLabel,
  panelTitle,
  panelDescription,
  formLabel,
  formTitle,
  formDescription,
  children,
}) {
  return (
    <main className="bg-auth-pattern min-h-screen px-lg py-xl sm:px-xl sm:py-2xl">
      <div className="mx-auto grid w-full max-w-[70rem] gap-lg lg:grid-cols-[1.08fr,0.92fr]">
        <section className="surface-glass hidden rounded-2xl border border-line/75 p-2xl lg:block">
          <Link to="/" className="inline-flex items-center gap-sm">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <LockKeyholeIcon className="size-4" />
            </span>
            <Text as="span" weight="semibold">
              {APP_TITLE}
            </Text>
          </Link>

          <Text
            as="p"
            size="caption"
            weight="semibold"
            className="mt-xl inline-flex rounded-full border border-primary/25 bg-primary/10 px-md py-xs uppercase tracking-[0.12em] text-primary"
          >
            {panelLabel}
          </Text>

          <Heading level={1} size="display" className="mt-md max-w-[16ch]">
            {panelTitle}
          </Heading>
          <Text tone="muted" className="mt-md max-w-[56ch]">
            {panelDescription}
          </Text>

          <div className="mt-xl space-y-sm">
            {VALUE_POINTS.map((point) => {
              const Icon = point.icon
              return (
                <article
                  key={point.id}
                  className="rounded-xl border border-line/75 bg-panel/65 p-md"
                >
                  <div className="mb-xs inline-flex size-8 items-center justify-center rounded-md bg-primary/15 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <Text as="p" weight="semibold">
                    {point.title}
                  </Text>
                  <Text tone="muted" size="body-sm" className="mt-2xs">
                    {point.description}
                  </Text>
                </article>
              )
            })}
          </div>
        </section>

        <section className="surface-glass rounded-2xl border border-line/75 p-lg sm:p-xl lg:p-2xl">
          <Link to="/" className="inline-flex items-center gap-sm">
            <span className="inline-flex size-8 items-center justify-center rounded-md bg-primary/15 text-primary">
              <LockKeyholeIcon className="size-4" />
            </span>
            <Text as="span" size="body-sm" weight="semibold">
              {APP_TITLE}
            </Text>
          </Link>

          <div className="mt-xl">
            <Text
              as="p"
              size="caption"
              weight="semibold"
              className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-md py-xs uppercase tracking-[0.1em] text-primary"
            >
              {formLabel}
            </Text>
            <Heading level={2} size="title" className="mt-sm">
              {formTitle}
            </Heading>
            <Text tone="muted" className="mt-xs">
              {formDescription}
            </Text>
          </div>

          <div className="mt-lg">{children}</div>

          <Link
            to="/"
            className="mt-lg inline-flex items-center gap-xs text-body-sm font-semibold text-primary hover:underline"
          >
            Back to landing
            <MoveRightIcon className="size-4" />
          </Link>
        </section>
      </div>
    </main>
  )
}

export default AuthPageShell
