import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from './constants.js'

const toSafeInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

const parsePagination = (query = {}) => {
  const page = toSafeInteger(query.page, DEFAULT_PAGE)
  const limit = Math.min(toSafeInteger(query.limit, DEFAULT_LIMIT), MAX_LIMIT)
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

export { parsePagination }
