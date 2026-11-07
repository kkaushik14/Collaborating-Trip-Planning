import dotenv from 'dotenv'
import path from 'node:path'

dotenv.config()

const isVercel = process.env.VERCEL === '1'
const deploymentUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
const frontendBaseUrl = process.env.FRONTEND_BASE_URL || deploymentUrl || 'http://localhost:5173'

if (isVercel) {
  for (const key of ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
    if (!process.env[key] || process.env[key].includes('REPLACE_ME') || process.env[key].startsWith('change-this')) {
      throw new Error(`Configure ${key} in the Vercel project environment settings`)
    }
  }
  if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET ||
      process.env.JWT_ACCESS_SECRET.length < 32 || process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('JWT secrets must be distinct and at least 32 characters long')
  }
}

const parseNumberOrDefault = (value, fallback) => {
  const parsedValue = Number(value)
  return Number.isNaN(parsedValue) ? fallback : parsedValue
}

const env = {
  isVercel,
  uploadStorage: isVercel ? 'gridfs' : (process.env.UPLOAD_STORAGE || 'local'),
  uploadMaxBytes: isVercel ? 4 * 1024 * 1024 : 10 * 1024 * 1024,
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017',
  mongoDbName: process.env.MONGO_DB_NAME || 'collaborating_trip_planning',
  corsOrigin: process.env.CORS_ORIGIN || frontendBaseUrl,
  jwtAccessSecret:
    process.env.JWT_ACCESS_SECRET || 'change-this-access-secret-in-production',
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret-in-production',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  frontendBaseUrl,
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: parseNumberOrDefault(process.env.SMTP_PORT, 587),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || 'no-reply@tripplanner.local',
  uploadDir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
  rateLimitWindowMs: parseNumberOrDefault(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMax: parseNumberOrDefault(process.env.RATE_LIMIT_MAX, 300),
  authRateLimitMax: parseNumberOrDefault(process.env.AUTH_RATE_LIMIT_MAX, 20),
  auditLogEnabled: process.env.AUDIT_LOG_ENABLED !== 'false',
  docsEnabled: process.env.DOCS_ENABLED !== 'false',
}

export { env }
