import { apiRequest, ensureObject, ensureString } from './service-utils.js'

const normalizeHealth = (value) => {
  const payload = ensureObject(value)
  return {
    service: ensureString(payload.service, ''),
    database: ensureString(payload.database, ''),
    timestamp: ensureString(payload.timestamp, ''),
  }
}

const getServiceBanner = (options = {}) =>
  apiRequest(
    {
      path: '/',
      method: 'GET',
      skipAuth: true,
      ...options,
    },
    {
      resource: 'system',
      operation: 'getServiceBanner',
      defaultData: null,
      normalize: (value) => value,
    },
  )

const getHealth = (options = {}) =>
  apiRequest(
    {
      path: '/health',
      method: 'GET',
      skipAuth: true,
      ...options,
    },
    {
      resource: 'system',
      operation: 'getHealth',
      defaultData: {},
      normalize: normalizeHealth,
    },
  )

const getVersionedHealth = (options = {}) =>
  apiRequest(
    {
      path: '/api/v1/health',
      method: 'GET',
      skipAuth: true,
      ...options,
    },
    {
      resource: 'system',
      operation: 'getVersionedHealth',
      defaultData: {},
      normalize: normalizeHealth,
    },
  )

const getMetrics = (options = {}) =>
  apiRequest(
    {
      path: '/metrics',
      method: 'GET',
      skipAuth: true,
      ...options,
    },
    {
      resource: 'system',
      operation: 'getMetrics',
      expectEnvelope: false,
      normalize: (value) => ensureString(value, ''),
    },
  )

const getOpenApiSpec = (options = {}) =>
  apiRequest(
    {
      path: '/api/v1/openapi.json',
      method: 'GET',
      skipAuth: true,
      ...options,
    },
    {
      resource: 'system',
      operation: 'getOpenApiSpec',
      expectEnvelope: false,
      normalize: ensureObject,
    },
  )

const getApiDocsPage = (options = {}) =>
  apiRequest(
    {
      path: '/api/v1/docs',
      method: 'GET',
      skipAuth: true,
      ...options,
    },
    {
      resource: 'system',
      operation: 'getApiDocsPage',
      expectEnvelope: false,
      normalize: (value) => ensureString(value, ''),
    },
  )

const getUploadedFile = (fileName, options = {}) =>
  apiRequest(
    {
      path: `/uploads/${encodeURIComponent(fileName)}`,
      method: 'GET',
      skipAuth: true,
      ...options,
    },
    {
      resource: 'system',
      operation: 'getUploadedFile',
      expectEnvelope: false,
      normalize: (value) => value,
    },
  )

export {
  getApiDocsPage,
  getHealth,
  getMetrics,
  getOpenApiSpec,
  getServiceBanner,
  getUploadedFile,
  getVersionedHealth,
}
