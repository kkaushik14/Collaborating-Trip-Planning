import mongoose from 'mongoose'

import { ApiError } from './api-error.js'

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value)

const assertObjectId = (value, fieldName = 'id') => {
  if (!isValidObjectId(value)) {
    throw ApiError.badRequest(`Invalid ${fieldName}`)
  }

  return value
}

const toObjectId = (value, fieldName = 'id') => {
  const safeId = assertObjectId(value, fieldName)
  return new mongoose.Types.ObjectId(safeId)
}

export { assertObjectId, isValidObjectId, toObjectId }
