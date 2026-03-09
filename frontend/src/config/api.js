const normalizeBaseUrl = (value) => (value || '').trim().replace(/\/+$/, '')

const DEFAULT_LOCAL_API_BASE_URL = 'http://localhost:3478/api/v1'
const DEFAULT_HEALTH_PATH = '/health'

const resolvedApiBaseUrl = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_LOCAL_API_BASE_URL,
)

const resolvedHealthPath = (import.meta.env.VITE_API_HEALTH_PATH || DEFAULT_HEALTH_PATH).trim()

const apiConfig = Object.freeze({
  baseUrl: resolvedApiBaseUrl,
  healthPath: resolvedHealthPath.startsWith('/') ? resolvedHealthPath : `/${resolvedHealthPath}`,
  timeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000),
  useMocks: import.meta.env.VITE_USE_API_MOCKS !== 'false',
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
