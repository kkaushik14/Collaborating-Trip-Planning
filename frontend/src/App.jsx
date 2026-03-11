import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'

import { ProtectedRoute, useAuth } from './app/AuthProvider/index.js'
import { getRedirectPathFromLocation } from './app/AuthProvider/redirect-utils.js'
import { TravelLoader } from './components/common/index.js'
import { MainLayout } from './layouts/index.js'
import {
  InvitationsPage,
  LandingPage,
  LoginPage,
  NotFoundPage,
  RegisterPage,
  TripAnalyticsPage,
  TripCollaborationPage,
  TripOrganizationPage,
  TripPlanningPage,
  TripRouteLayout,
  TripsPage,
} from './pages/index.js'

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center px-lg py-xl sm:px-xl">
      <div className="w-full max-w-xl rounded-xl border border-line bg-panel p-xl shadow-card sm:p-2xl">
        <TravelLoader
          title="Restoring your session..."
          description="Checking your account and preparing your trip workspace."
        />
      </div>
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
    const redirectPath = getRedirectPathFromLocation(location, '/trips')
    return <Navigate to={redirectPath} replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route
          path="/login"
          element={(
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          )}
        />
        <Route
          path="/register"
          element={(
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          )}
        />

        <Route element={<ProtectedAppLayout />}>
          <Route path="/invitations" element={<InvitationsPage />} />
          <Route path="/invitations/accept" element={<InvitationsPage />} />
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
