import { Link } from 'react-router-dom'

import { useAuth } from '../app/AuthProvider/index.js'
import { SiteFooter } from '../components/common/index.js'
import { Heading, Text } from '../components/typography/index.js'

const NotFoundPage = () => {
  const { isAuthenticated } = useAuth()
  const homePath = isAuthenticated ? '/trips' : '/'

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <main className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-xl py-3xl">
        <section className="surface-card w-full max-w-lg p-2xl text-center">
          <Heading level={1} size="title">
            Route not available
          </Heading>
          <Text tone="muted" className="mt-sm">
            The page you requested is unavailable or the link has changed.
          </Text>
          <Text tone="muted" size="body-sm" className="mt-xs">
            Continue from your main workspace route and try again.
          </Text>
          <Link
            to={homePath}
            className="mt-lg inline-flex rounded-md border border-line bg-panel-muted px-lg py-sm text-body-sm font-medium text-ink transition-colors hover:bg-line/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Go to {isAuthenticated ? 'Trips' : 'Home'}
          </Link>
        </section>
      </main>
      <SiteFooter mode="notFound" />
    </div>
  )
}

export default NotFoundPage
