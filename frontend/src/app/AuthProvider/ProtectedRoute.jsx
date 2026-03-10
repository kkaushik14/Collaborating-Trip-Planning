import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from './useAuth.js'

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

    return (
      <Navigate
        to={redirectTo}
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
