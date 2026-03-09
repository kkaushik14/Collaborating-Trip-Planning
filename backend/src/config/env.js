import dotenv from 'dotenv'
import path from 'node:path'

dotenv.config()

const parseNumberOrDefault = (value, fallback) => {
  const parsedValue = Number(value)
  return Number.isNaN(parsedValue) ? fallback : parsedValue
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017',
  mongoDbName: process.env.MONGO_DB_NAME || 'collaborating_trip_planning',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtAccessSecret:
    process.env.JWT_ACCESS_SECRET || 'change-this-access-secret-in-production',
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret-in-production',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || 'http://localhost:5173',
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
