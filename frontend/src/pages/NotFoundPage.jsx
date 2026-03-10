import { Link } from 'react-router-dom'

import { useAuth } from '../app/AuthProvider/index.js'
import { Heading, Text } from '../components/typography/index.js'

const NotFoundPage = () => {
  const { isAuthenticated } = useAuth()
  const homePath = isAuthenticated ? '/trips' : '/'

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-xl py-3xl">
      <section className="w-full max-w-md rounded-2xl border border-line bg-panel p-xl text-center shadow-card">
        <Heading level={1} size="title">
          Page Not Found
        </Heading>
        <Text tone="muted" className="mt-sm">
          The route you requested does not exist.
        </Text>
        <Link
          to={homePath}
          className="mt-lg inline-flex rounded-md border border-line bg-panel-muted px-lg py-sm text-body-sm font-medium text-ink transition-colors hover:bg-line/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Go to {isAuthenticated ? 'Trips' : 'Home'}
        </Link>
      </section>
    </main>
  )
}

export default NotFoundPage
