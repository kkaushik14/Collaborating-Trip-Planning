import { env } from '../config/index.js'
import { ApiError, ApiResponse } from '../utils/index.js'

const errorHandler = (error, _req, res, _next) => {
  let normalizedError

  if (error instanceof ApiError) {
    normalizedError = error
  } else if (error.name === 'MulterError') {
    normalizedError = error.code === 'LIMIT_FILE_SIZE'
      ? new ApiError(413, `File must be at most ${env.uploadMaxBytes / 1024 / 1024} MB`)
      : new ApiError(400, error.message || 'Invalid file upload request')
  } else {
    normalizedError = new ApiError(error.statusCode || 500, error.message || 'Internal server error')
  }

  const response = new ApiResponse(normalizedError.statusCode, null, normalizedError.message, {
    errors: normalizedError.errors,
    requestId: _req.requestId || '',
  })

  if (env.nodeEnv !== 'production') {
    response.meta = {
      ...(response.meta || {}),
      stack: error.stack,
    }
  }

  return res.status(normalizedError.statusCode).json(response)
}

export { errorHandler }
