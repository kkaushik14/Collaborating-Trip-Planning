import express from 'express'
import { app } from './src/app.js'
import { connectDatabase } from './src/config/index.js'

const service = express()

service.use(async (_req, res, next) => {
  try {
    await connectDatabase()
    next()
  } catch {
    res.status(503).json({
      success: false,
      statusCode: 503,
      message: 'Database temporarily unavailable. Please try again.',
      data: null,
    })
  }
})
service.use(app)

export default service
