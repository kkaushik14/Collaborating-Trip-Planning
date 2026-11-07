import mongoose from 'mongoose'

import { env } from '../config/index.js'
import { AuditLog } from '../models/index.js'
import { keepAlive } from '../utils/index.js'

const shouldSkipAudit = (pathName) => {
  return (
    pathName.startsWith('/health') ||
    pathName.startsWith('/api/v1/health') ||
    pathName.startsWith('/metrics') ||
    pathName.startsWith('/api/v1/docs') ||
    pathName.startsWith('/api/v1/openapi.json')
  )
}

const auditLogger = (req, res, next) => {
  if (!env.auditLogEnabled || shouldSkipAudit(req.path)) {
    next()
    return
  }

  const startedAt = Date.now()

  const completion = new Promise((resolve) => {
    res.once('finish', resolve)
    res.once('close', resolve)
  }).then(async () => {
    if (mongoose.connection.readyState !== 1) {
      return
    }

    try {
      const actorId = req.user?._id || null

      await AuditLog.create({
        actor: actorId,
        method: req.method,
        path: req.originalUrl.split(/[?#]/)[0],
        statusCode: res.statusCode,
        success: res.statusCode < 400,
        ip: req.ip,
        userAgent: req.headers['user-agent'] || '',
        durationMs: Date.now() - startedAt,
        requestId: req.requestId || '',
      })
    } catch (error) {
      if (!error.message.includes('Operation interrupted because client was closed')) {
        console.error('Audit logging failed:', error.message)
      }
    }
  })
  keepAlive(completion)

  next()
}

export { auditLogger }
