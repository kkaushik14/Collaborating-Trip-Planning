import { Link } from 'react-router-dom'

import { APP_TITLE } from '../../config/site.js'
import { cn } from '../../lib/utils.js'

const baseColumns = {
  legal: [
    { label: 'Terms Of Service', href: '/' },
    { label: 'Privacy Policy', href: '/' },
    { label: 'Support', href: '/' },
  ],
}

const footerConfig = {
  marketing: {
    headline: 'TRIP PLANNER',
    summary: 'Plan, collaborate, and manage every trip detail from one command center.',
    columns: [
      {
        label: 'Website',
        links: [
          { label: 'Home', href: '/' },
          { label: 'Trips', href: '/trips' },
          { label: 'Invitations', href: '/invitations' },
          { label: 'Create Account', href: '/register' },
        ],
      },
      {
        label: 'Legal',
        links: baseColumns.legal,
      },
    ],
  },
  app: {
    headline: APP_TITLE.toUpperCase(),
    summary: 'Secure workspace for planning, collaboration, organization, and analytics.',
    columns: [
      {
        label: 'Workspace',
        links: [
          { label: 'Trips', href: '/trips' },
          { label: 'Invitations', href: '/invitations' },
          { label: 'Planning', href: '/trips' },
          { label: 'Analytics', href: '/trips' },
        ],
      },
      {
        label: 'Account',
        links: [
          { label: 'Login', href: '/login' },
          { label: 'Register', href: '/register' },
          { label: 'Home', href: '/' },
          { label: 'Support', href: '/' },
        ],
      },
    ],
  },
  auth: {
    headline: APP_TITLE.toUpperCase(),
    summary: 'Sign in securely and continue your trip workflow without context switching.',
    columns: [
      {
        label: 'Access',
        links: [
          { label: 'Login', href: '/login' },
          { label: 'Register', href: '/register' },
          { label: 'Home', href: '/' },
        ],
      },
      {
        label: 'Legal',
        links: baseColumns.legal,
      },
    ],
  },
  notFound: {
    headline: APP_TITLE.toUpperCase(),
    summary: 'Lost route, same platform. Continue from a known page.',
    columns: [
      {
        label: 'Navigate',
        links: [
          { label: 'Home', href: '/' },
          { label: 'Trips', href: '/trips' },
          { label: 'Login', href: '/login' },
        ],
      },
      {
        label: 'Legal',
        links: baseColumns.legal,
      },
    ],
  },
}

function SiteFooter({ mode = 'app', className }) {
  const selectedMode = footerConfig[mode] ? mode : 'app'
  const config = footerConfig[selectedMode]
  const year = new Date().getFullYear()

  return (
    <footer className={cn('relative overflow-hidden border-t border-line/60 bg-canvas/70', className)}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_8%,rgb(var(--color-primary)/0.24),transparent_48%),radial-gradient(circle_at_20%_78%,rgb(var(--color-neutral)/0.26),transparent_54%)]" />
      </div>
      <div className="relative mx-auto max-w-layout px-lg pb-2xl pt-3xl sm:px-xl">
        <div className="mx-auto max-w-[62rem]">
          <p className="break-words text-center text-[clamp(2.2rem,9.8vw,5.8rem)] font-semibold leading-none tracking-tight text-transparent [text-stroke:1px_rgb(var(--color-warning)/0.75)] [-webkit-text-stroke:1px_rgb(var(--color-warning)/0.75)] bg-[radial-gradient(circle_at_50%_20%,rgb(var(--color-warning)),rgb(var(--color-primary)))] bg-clip-text">
            {config.headline}
          </p>
          <p className="mx-auto mt-md max-w-[48ch] text-center text-body text-ink-muted">
            {config.summary}
          </p>
        </div>

        <div className="mt-2xl grid gap-xl sm:grid-cols-2">
          {config.columns.map((column) => (
            <div key={column.label}>
              <p className="text-caption uppercase tracking-[0.12em] text-ink-muted">
                {column.label}
              </p>
              <ul className="mt-md space-y-sm">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-title-sm font-medium text-ink transition-colors hover:text-warning">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-2xl flex flex-wrap items-center justify-between gap-sm border-t border-line/60 pt-md text-body-sm text-ink-muted">
          <p>
            Copyright © {year} {APP_TITLE}. All rights reserved.
          </p>
          <div className="flex items-center gap-md">
            <span>Twitter</span>
            <span>LinkedIn</span>
            <span>Instagram</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
