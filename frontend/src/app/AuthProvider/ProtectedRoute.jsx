import { useAuth } from './useAuth.js'

const ProtectedRoute = ({
  children,
  fallback = null,
  loadingFallback = null,
}) => {
  const { isAuthenticated, isInitializing } = useAuth()

  if (isInitializing) {
    return loadingFallback
  }

  if (!isAuthenticated) {
    return fallback
  }

  return children
}

export { ProtectedRoute }
