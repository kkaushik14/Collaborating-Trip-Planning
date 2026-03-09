import crypto from 'node:crypto'

const requestIdMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID()
  req.requestId = requestId
  res.setHeader('x-request-id', requestId)
  next()
}

export { requestIdMiddleware }
