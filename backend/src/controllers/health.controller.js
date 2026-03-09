import mongoose from 'mongoose'

import { ApiResponse, asyncHandler } from '../utils/index.js'

const getHealth = asyncHandler(async (_req, res) => {
  const databaseState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        service: 'backend',
        database: databaseState,
        timestamp: new Date().toISOString(),
      },
      'Health check successful',
    ),
  )
})

export { getHealth }
