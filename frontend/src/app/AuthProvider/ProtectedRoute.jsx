import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from './useAuth.js'
import { buildAuthRouteSearch } from './redirect-utils.js'

const ProtectedRoute = ({
  children,
  fallback = null,
  loadingFallback = null,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, isInitializing } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return loadingFallback
  }

  if (!isAuthenticated) {
    if (fallback) {
      return fallback
    }

    const nextPath = `${location.pathname}${location.search || ''}${location.hash || ''}`
    const redirectSearch = buildAuthRouteSearch(nextPath)

    return (
      <Navigate
        to={`${redirectTo}${redirectSearch}`}
        replace
        state={{
          from: location,
        }}
      />
    )
  }

  return children || <Outlet />
}

export { ProtectedRoute }
