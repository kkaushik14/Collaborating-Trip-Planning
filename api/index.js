import { app } from '../backend/src/app.js'
import { connectDatabase } from '../backend/src/config/index.js'

export default async function handler(req, res) {
  try {
    await connectDatabase()
  } catch {
    return res.status(503).json({
      success: false,
      statusCode: 503,
      message: 'Database temporarily unavailable. Please try again.',
      data: null,
    })
  }
  return app(req, res)
}
