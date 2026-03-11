import { getApiConfig } from '../../config/index.js'
import { getMockResponse } from '../mocks/index.js'

const API_CONFIG = getApiConfig()
const API_BASE_URL = API_CONFIG.baseUrl
const USE_API_MOCKS = API_CONFIG.useMocks
const ALLOW_MOCKS_IN_PRODUCTION = API_CONFIG.allowMocksInProd === true
const DEFAULT_TIMEOUT_MS = Number(API_CONFIG.timeoutMs || 15000)
const DEFAULT_MOCK_DELAY_MS = Number(import.meta.env.VITE_MOCK_DELAY_MS || 120)

const DEFAULT_HEADERS = Object.freeze({
  Accept: 'application/json',
})

const AUTH_TOKEN_STORAGE_KEYS = Object.freeze([
  'accessToken',
  'authToken',
  'tripPlannerAccessToken',
])

class HttpClientError extends Error {
  constructor({
    message,
    status = null,
    code = 'REQUEST_FAILED',
    payload = null,
    method = 'GET',
    url = '',
    isNetworkError = false,
    isTimeout = false,
    cause,
  }) {
    super(message)
    this.name = 'HttpClientError'
    this.status = status
    this.code = code
    this.payload = payload
    this.method = method
    this.url = url
    this.isNetworkError = isNetworkError
    this.isTimeout = isTimeout

    if (cause) {
      this.cause = cause
    }
  }
}

const defaultAuthTokenProvider = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  for (const key of AUTH_TOKEN_STORAGE_KEYS) {
    const value = window.localStorage.getItem(key)
    if (value) {
      return value
    }
  }

  return null
}

let authTokenProvider = defaultAuthTokenProvider

const getAuthToken = () => {
  if (typeof authTokenProvider !== 'function') {
    return null
  }

  const token = authTokenProvider()
  return typeof token === 'string' ? token.trim() : null
}

const setAuthTokenProvider = (provider) => {
  if (typeof provider !== 'function') {
    throw new TypeError('auth token provider must be a function')
  }

  authTokenProvider = provider
}

const resetAuthTokenProvider = () => {
  authTokenProvider = defaultAuthTokenProvider
}

const getApiBaseUrl = () => API_BASE_URL

const sleep = (durationMs) =>
  new Promise((resolve) => {
    setTimeout(resolve, durationMs)
  })

const buildUrl = (path, query = {}) => {
  const finalPath = path.startsWith('/') ? path : `/${path}`
  const hasApiPrefix = finalPath.startsWith('/api/v1')
  const normalizedApiBase = String(API_BASE_URL || '').trim()
  const resolvedBaseRoot = (() => {
    if (/^https?:\/\//i.test(normalizedApiBase)) {
      return hasApiPrefix
        ? normalizedApiBase.replace(/\/api\/v1\/?$/, '')
        : normalizedApiBase
    }

    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin
    }

    return 'http://localhost'
  })()
  const url = new URL(finalPath, `${resolvedBaseRoot.replace(/\/$/, '')}/`)

  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined || value === null) {
      continue
    }

    url.searchParams.set(key, String(value))
  }

  return url
}

const normalizeHeaders = (headers = {}) => {
  const normalized = new Headers(DEFAULT_HEADERS)
  const sourceHeaders = headers instanceof Headers ? headers : new Headers(headers)

  sourceHeaders.forEach((value, key) => {
    normalized.set(key, value)
  })

  return normalized
}

const formatAuthorizationHeader = (token) =>
  /^Bearer\s+/i.test(token) ? token : `Bearer ${token}`

const attachAuthorizationHeader = ({ headers, skipAuth, authToken }) => {
  if (skipAuth || headers.has('Authorization')) {
    return
  }

  const token = (authToken || getAuthToken() || '').trim()
  if (!token) {
    return
  }

  headers.set('Authorization', formatAuthorizationHeader(token))
}

const parseResponsePayload = async (response) => {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  return response.text()
}

const STATUS_ERROR_CODE_MAP = Object.freeze({
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  429: 'RATE_LIMITED',
  500: 'SERVER_ERROR',
})

const mapErrorMessage = ({ status, payload, fallback }) => {
  if (payload && typeof payload === 'object' && payload.message) {
    return String(payload.message)
  }

  if (typeof payload === 'string' && payload.trim()) {
    return payload
  }

  return fallback || `Request failed with status ${status}`
}

const createHttpError = ({ status, payload, url, method }) =>
  new HttpClientError({
    message: mapErrorMessage({ status, payload }),
    status,
    code: payload?.code || STATUS_ERROR_CODE_MAP[status] || 'REQUEST_FAILED',
    payload,
    method,
    url,
  })

const createNetworkError = ({ method, url, timeoutMs, timedOut, cause }) =>
  new HttpClientError({
    message: timedOut
      ? `Request timed out after ${timeoutMs}ms`
      : 'Network request failed. Please check connectivity and try again.',
    status: timedOut ? 408 : null,
    code: timedOut ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
    payload: null,
    method,
    url,
    isNetworkError: true,
    isTimeout: timedOut,
    cause,
  })

const requestViaMock = async ({
  method,
  path,
  query,
  mockDelayMs = DEFAULT_MOCK_DELAY_MS,
}) => {
  await sleep(Math.max(0, mockDelayMs))

  const mockResponse = getMockResponse({
    method,
    path,
    query,
  })

  if (mockResponse.status >= 400) {
    throw createHttpError({
      status: mockResponse.status,
      payload: mockResponse.body,
      url: buildUrl(path, query).toString(),
      method,
    })
  }

  return {
    status: mockResponse.status,
    data: mockResponse.body,
    contentType: mockResponse.contentType || 'application/json',
    mock: true,
  }
}

const buildAbortContext = ({ timeoutMs, signal }) => {
  const controller = new AbortController()
  let timeoutId = null
  let timedOut = false

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason)
    } else {
      signal.addEventListener(
        'abort',
        () => {
          controller.abort(signal.reason)
        },
        { once: true },
      )
    }
  }

  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      timedOut = true
      controller.abort('request-timeout')
    }, timeoutMs)
  }

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    },
  }
}

const requestViaNetwork = async ({
  method,
  path,
  headers,
  body,
  query,
  signal,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  skipAuth = false,
  authToken,
}) => {
  const url = buildUrl(path, query)
  const normalizedHeaders = normalizeHeaders(headers)
  const hasJsonBody = body !== undefined && body !== null && !(body instanceof FormData)
  const abortContext = buildAbortContext({
    timeoutMs,
    signal,
  })

  if (hasJsonBody && !normalizedHeaders.has('Content-Type')) {
    normalizedHeaders.set('Content-Type', 'application/json')
  }

  attachAuthorizationHeader({
    headers: normalizedHeaders,
    skipAuth,
    authToken,
  })

  try {
    const response = await fetch(url, {
      method,
      headers: normalizedHeaders,
      body: body === undefined || body === null ? undefined : hasJsonBody ? JSON.stringify(body) : body,
      signal: abortContext.signal,
    })

    const payload = await parseResponsePayload(response)

    if (!response.ok) {
      throw createHttpError({
        status: response.status,
        payload,
        url: url.toString(),
        method,
      })
    }

    return {
      status: response.status,
      data: payload,
      contentType: response.headers.get('content-type') || 'application/json',
      mock: false,
    }
  } catch (error) {
    if (error instanceof HttpClientError) {
      throw error
    }

    throw createNetworkError({
      method,
      url: url.toString(),
      timeoutMs,
      timedOut: abortContext.didTimeout(),
      cause: error,
    })
  } finally {
    abortContext.cleanup()
  }
}

const request = async ({
  path,
  method = 'GET',
  headers = {},
  body,
  query,
  signal,
  useMock = USE_API_MOCKS,
  mockDelayMs,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  skipAuth = false,
  authToken,
} = {}) => {
  if (!path) {
    throw new Error('request path is required')
  }

  const normalizedMethod = method.toUpperCase()
  const isProductionRuntime = Boolean(import.meta.env.PROD)
  const shouldUseMock =
    Boolean(useMock) && (!isProductionRuntime || ALLOW_MOCKS_IN_PRODUCTION)

  if (shouldUseMock) {
    return requestViaMock({
      method: normalizedMethod,
      path,
      query,
      mockDelayMs,
    })
  }

  return requestViaNetwork({
    method: normalizedMethod,
    path,
    headers,
    body,
    query,
    signal,
    timeoutMs,
    skipAuth,
    authToken,
  })
}

export {
  HttpClientError,
  USE_API_MOCKS,
  getApiBaseUrl,
  getAuthToken,
  request,
  resetAuthTokenProvider,
  setAuthTokenProvider,
}
