import { ApiError } from './api-error.js'

const parseDateOrThrow = (value, fieldName) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw ApiError.badRequest(`Invalid ${fieldName}`)
  }

  return date
}

export { parseDateOrThrow }
