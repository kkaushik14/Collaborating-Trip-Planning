import { HttpClientError, request } from './httpClient/index.js'

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const ensureObject = (value) => (isObject(value) ? value : {})

const ensureArray = (value) => (Array.isArray(value) ? value : [])

const ensureString = (value, fallback = '') =>
  typeof value === 'string' && value.trim() ? value : fallback

const ensureNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizePaginationMeta = (meta) => {
  if (!isObject(meta)) {
    return null
  }

  return {
    page: ensureNumber(meta.page, 1),
    limit: ensureNumber(meta.limit, 20),
    total: ensureNumber(meta.total, 0),
    totalPages: ensureNumber(meta.totalPages, 0),
  }
}

class ServiceError extends Error {
  constructor({
    message,
    status = null,
    code = 'SERVICE_ERROR',
    resource = 'unknown',
    operation = 'request',
    errors = [],
    requestId = null,
    details = null,
    cause,
  }) {
    super(message)
    this.name = 'ServiceError'
    this.status = status
    this.code = code
    this.resource = resource
    this.operation = operation
    this.errors = ensureArray(errors)
    this.requestId = requestId
    this.details = details

    if (cause) {
      this.cause = cause
    }
  }
}

const toServiceError = (error, { resource = 'unknown', operation = 'request' } = {}) => {
  if (error instanceof ServiceError) {
    return error
  }

  if (error instanceof HttpClientError) {
    const payload = isObject(error.payload) ? error.payload : null
    const meta = ensureObject(payload?.meta)
    const status = error.status ?? payload?.statusCode ?? null

    return new ServiceError({
      message: ensureString(payload?.message, ensureString(error.message, 'Request failed')),
      status,
      code: ensureString(payload?.code, ensureString(error.code, status ? `HTTP_${status}` : 'SERVICE_ERROR')),
      resource,
      operation,
      errors: ensureArray(meta.errors),
      requestId: ensureString(meta.requestId, null),
      details: payload?.data ?? payload ?? null,
      cause: error,
    })
  }

  return new ServiceError({
    message: ensureString(error?.message, 'Unexpected service error'),
    resource,
    operation,
    cause: error,
  })
}

const normalizeEnvelope = ({ httpResponse, defaultData = null, resource, operation }) => {
  const body = httpResponse?.data

  if (!isObject(body) || !Object.prototype.hasOwnProperty.call(body, 'success')) {
    return {
      statusCode: ensureNumber(httpResponse?.status, 200),
      message: '',
      data: body ?? defaultData,
      meta: null,
    }
  }

  if (body.success === false) {
    throw new ServiceError({
      message: ensureString(body.message, 'Request failed'),
      status: ensureNumber(body.statusCode, httpResponse?.status ?? 500),
      code: ensureString(body.code, 'SERVICE_ERROR'),
      resource,
      operation,
      errors: ensureArray(body?.meta?.errors),
      requestId: ensureString(body?.meta?.requestId, null),
      details: body?.data ?? null,
    })
  }

  return {
    statusCode: ensureNumber(body.statusCode, httpResponse?.status ?? 200),
    message: ensureString(body.message, ''),
    data: body.data === undefined ? defaultData : body.data,
    meta: normalizePaginationMeta(body.meta) || body.meta || null,
  }
}

const apiRequest = async (
  requestOptions,
  {
    resource = 'unknown',
    operation = 'request',
    defaultData = null,
    normalize = (value) => value,
    includeEnvelope = false,
    expectEnvelope = true,
  } = {},
) => {
  try {
    const httpResponse = await request(requestOptions)

    if (!expectEnvelope) {
      const normalizedData = normalize(httpResponse.data)
      if (!includeEnvelope) {
        return normalizedData
      }

      return {
        statusCode: ensureNumber(httpResponse.status, 200),
        message: '',
        data: normalizedData,
        meta: null,
        contentType: ensureString(httpResponse.contentType, 'application/json'),
      }
    }

    const envelope = normalizeEnvelope({
      httpResponse,
      defaultData,
      resource,
      operation,
    })
    const normalizedData = normalize(envelope.data)

    if (!includeEnvelope) {
      return normalizedData
    }

    return {
      ...envelope,
      data: normalizedData,
    }
  } catch (error) {
    throw toServiceError(error, { resource, operation })
  }
}

export {
  ServiceError,
  apiRequest,
  ensureArray,
  ensureNumber,
  ensureObject,
  ensureString,
  normalizePaginationMeta,
  toServiceError,
}
