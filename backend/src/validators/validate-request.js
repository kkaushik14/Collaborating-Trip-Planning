import { ApiError } from '../utils/index.js'

const bodyOptions = {
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: true,
}

const paramsOptions = {
  abortEarly: false,
  allowUnknown: true,
}

const queryOptions = {
  abortEarly: false,
  allowUnknown: true,
}

const validateRequest = ({ body, params, query } = {}) => {
  return (req, _res, next) => {
    const errors = []

    if (body) {
      const { error, value } = body.validate(req.body, bodyOptions)
      if (error) {
        errors.push(...error.details.map((detail) => detail.message))
      } else {
        req.body = value
      }
    }

    if (params) {
      const { error, value } = params.validate(req.params, paramsOptions)
      if (error) {
        errors.push(...error.details.map((detail) => detail.message))
      } else {
        req.params = value
      }
    }

    if (query) {
      const { error, value } = query.validate(req.query, queryOptions)
      if (error) {
        errors.push(...error.details.map((detail) => detail.message))
      } else {
        req.validatedQuery = value

        if (req.query && typeof req.query === 'object') {
          for (const key of Object.keys(req.query)) {
            if (!(key in value)) {
              delete req.query[key]
            }
          }

          Object.assign(req.query, value)
        }
      }
    }

    if (errors.length > 0) {
      throw ApiError.badRequest('Validation failed', errors)
    }

    next()
  }
}

export { validateRequest }
