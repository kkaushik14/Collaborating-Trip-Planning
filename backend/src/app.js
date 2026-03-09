import fs from 'node:fs'

import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import swaggerUi from 'swagger-ui-express'

import { env } from './config/index.js'
import { getHealth } from './controllers/index.js'
import { openApiSpec } from './docs/index.js'
import {
  apiRateLimiter,
  auditLogger,
  errorHandler,
  metricsHandler,
  metricsMiddleware,
  notFoundHandler,
  requestIdMiddleware,
} from './middlewares/index.js'
import { apiRouter } from './routes/index.js'
import { ApiResponse } from './utils/index.js'

const app = express()

app.set('trust proxy', 1)

app.use(requestIdMiddleware)
app.use(helmet())
app.use(
  cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin,
    credentials: true,
  }),
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))
app.use(metricsMiddleware)
app.use(auditLogger)

fs.mkdirSync(env.uploadDir, { recursive: true })
app.use('/uploads', express.static(env.uploadDir))

app.get('/', (_req, res) => {
  res.status(200).json(new ApiResponse(200, null, 'Collaborating Trip Planning API'))
})

app.get('/health', getHealth)
app.get('/metrics', metricsHandler)

if (env.docsEnabled) {
  app.get('/api/v1/openapi.json', (_req, res) => {
    res.status(200).json(openApiSpec)
  })

  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec))
}

app.use('/api/v1', apiRateLimiter, apiRouter)

app.use(notFoundHandler)
app.use(errorHandler)

export { app }
