import { env } from '../config/index.js'

const normalizeBaseUrl = (value) => {
  const input = String(value || '').trim()
  if (!input || input.toLowerCase() === 'null' || input.toLowerCase() === 'undefined') {
    return ''
  }

  if (!/^https?:\/\//i.test(input)) {
    return ''
  }

  return input.replace(/\/+$/, '')
}

const getHeaderValue = (value) => {
  if (Array.isArray(value)) {
    return String(value[0] || '').trim()
  }

  return String(value || '').trim()
}

const isLocalHost = (hostValue = '') => /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(hostValue)

const resolveFrontendBaseUrl = (req) => {
  const origin = normalizeBaseUrl(req?.headers?.origin)
  if (origin) {
    return origin
  }

  const forwardedHost = getHeaderValue(req?.headers?.['x-forwarded-host'])
  const host = forwardedHost || getHeaderValue(req?.headers?.host)
  const forwardedProto = getHeaderValue(req?.headers?.['x-forwarded-proto'])

  if (host) {
    if (isLocalHost(host)) {
      return normalizeBaseUrl(env.frontendBaseUrl) || 'http://localhost:5173'
    }

    const protocol = forwardedProto || 'http'
    return `${protocol}://${host}`.replace(/\/+$/, '')
  }

  return normalizeBaseUrl(env.frontendBaseUrl) || 'http://localhost:5173'
}

export { resolveFrontendBaseUrl }
