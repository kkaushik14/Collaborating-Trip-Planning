import { ApiError } from '../utils/index.js'

const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.originalUrl}`))
}

export { notFoundHandler }
