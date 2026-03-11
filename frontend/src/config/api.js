const normalizeBaseUrl = (value) => (value || '').trim().replace(/\/+$/, '')
const normalizeBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  const normalized = String(value).trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

const DEFAULT_LOCAL_API_BASE_URL = 'http://localhost:3478/api/v1'
const DEFAULT_PROD_API_BASE_URL = '/api/v1'
const DEFAULT_HEALTH_PATH = '/health'
const DEFAULT_API_BASE_URL = import.meta.env.PROD
  ? DEFAULT_PROD_API_BASE_URL
  : DEFAULT_LOCAL_API_BASE_URL

const resolvedApiBaseUrl = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL,
)

const resolvedHealthPath = (import.meta.env.VITE_API_HEALTH_PATH || DEFAULT_HEALTH_PATH).trim()

const apiConfig = Object.freeze({
  baseUrl: resolvedApiBaseUrl,
  healthPath: resolvedHealthPath.startsWith('/') ? resolvedHealthPath : `/${resolvedHealthPath}`,
  timeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000),
  useMocks: normalizeBoolean(import.meta.env.VITE_USE_API_MOCKS, false),
  allowMocksInProd: normalizeBoolean(import.meta.env.VITE_ALLOW_PROD_MOCKS, false),
})

const getApiConfig = () => apiConfig

const getBackendHealthUrl = () => {
  const base = apiConfig.baseUrl.replace(/\/api\/v1\/?$/, '')
  return `${base}${apiConfig.healthPath}`
}

export {
  getApiConfig,
  getBackendHealthUrl,
}
