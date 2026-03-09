import { ProtectedRoute } from './AuthProvider/index.js'
import { MainLayout } from '../layouts/index.js'
import { HomePage } from '../pages/index.js'

const App = () => {
  return (
    <MainLayout>
      <ProtectedRoute
        loadingFallback={
          <p className="rounded-xl border border-line bg-panel p-xl text-body-sm text-ink-muted">
            Checking your session...
          </p>
        }
        fallback={
          <p className="rounded-xl border border-warning/40 bg-warning/10 p-xl text-body-sm text-ink">
            Sign in is required to access trip data routes.
          </p>
        }
      >
        <HomePage />
      </ProtectedRoute>
    </MainLayout>
  )
}

export default App
