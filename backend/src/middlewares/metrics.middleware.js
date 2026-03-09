import client from 'prom-client'

const metricsRegistry = new client.Registry()
client.collectDefaultMetrics({ register: metricsRegistry })

const requestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [25, 50, 100, 200, 500, 1000, 3000],
  registers: [metricsRegistry],
})

const requestCount = new client.Counter({
  name: 'http_request_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
})

const metricsMiddleware = (req, res, next) => {
  const startedAt = Date.now()

  res.on('finish', () => {
    const route = req.route?.path || req.path
    const statusCode = String(res.statusCode)
    const durationMs = Date.now() - startedAt

    requestCount.inc({ method: req.method, route, status_code: statusCode })
    requestDuration.observe({ method: req.method, route, status_code: statusCode }, durationMs)
  })

  next()
}

const metricsHandler = async (_req, res) => {
  res.set('Content-Type', metricsRegistry.contentType)
  res.end(await metricsRegistry.metrics())
}

export { metricsHandler, metricsMiddleware, metricsRegistry }
