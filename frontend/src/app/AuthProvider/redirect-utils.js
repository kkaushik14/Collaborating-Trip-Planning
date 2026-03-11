const AUTH_ROUTE_PATHS = new Set(['/login', '/register'])

const isSafeInternalPath = (value = '') => {
  const path = String(value || '').trim()
  return Boolean(path) && path.startsWith('/') && !path.startsWith('//')
}

const normalizeRedirectPath = (pathname = '', search = '', hash = '') => {
  if (!isSafeInternalPath(pathname) || AUTH_ROUTE_PATHS.has(pathname)) {
    return ''
  }

  return `${pathname}${search || ''}${hash || ''}`
}

const getRedirectPathFromLocation = (location, fallback = '/trips') => {
  const fromLocation = location?.state?.from
  const fromPath = normalizeRedirectPath(
    fromLocation?.pathname,
    fromLocation?.search,
    fromLocation?.hash,
  )

  if (fromPath) {
    return fromPath
  }

  const searchParams = new URLSearchParams(location?.search || '')
  const nextPath = searchParams.get('next') || ''
  if (isSafeInternalPath(nextPath) && !AUTH_ROUTE_PATHS.has(nextPath)) {
    return nextPath
  }

  return fallback
}

const buildAuthRouteSearch = (redirectPath = '/trips') => {
  if (!isSafeInternalPath(redirectPath) || redirectPath === '/trips') {
    return ''
  }

  return `?next=${encodeURIComponent(redirectPath)}`
}

export { buildAuthRouteSearch, getRedirectPathFromLocation }
