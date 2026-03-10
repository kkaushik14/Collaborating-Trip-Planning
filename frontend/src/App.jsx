import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'

import { ProtectedRoute, useAuth } from './app/AuthProvider/index.js'
import { MainLayout } from './layouts/index.js'
import {
  LoginPage,
  NotFoundPage,
  TripAnalyticsPage,
  TripCollaborationPage,
  TripOrganizationPage,
  TripPlanningPage,
  TripRouteLayout,
  TripsPage,
} from './pages/index.js'

function RouteLoadingFallback() {
  return (
    <div className="rounded-xl border border-line bg-panel p-xl text-body-sm text-ink-muted">
      Checking your session...
    </div>
  )
}

function ProtectedAppLayout() {
  return (
    <ProtectedRoute loadingFallback={<RouteLoadingFallback />}>
      <MainLayout>
        <Outlet />
      </MainLayout>
    </ProtectedRoute>
  )
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isInitializing } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return <RouteLoadingFallback />
  }

  if (isAuthenticated) {
    const nextPath = location.state?.from?.pathname
    const redirectPath = nextPath && nextPath !== '/login' ? nextPath : '/trips'
    return <Navigate to={redirectPath} replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={(
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          )}
        />

        <Route element={<ProtectedAppLayout />}>
          <Route index element={<Navigate to="/trips" replace />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/trips/:tripId" element={<TripRouteLayout />}>
            <Route index element={<Navigate to="planning" replace />} />
            <Route path="planning" element={<TripPlanningPage />} />
            <Route path="collaboration" element={<TripCollaborationPage />} />
            <Route path="organization" element={<TripOrganizationPage />} />
            <Route path="analytics" element={<TripAnalyticsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
