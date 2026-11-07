import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'

test('Vercel handler connects on cold requests and preserves API paths', async () => {
  const mongo = await MongoMemoryServer.create()
  Object.assign(process.env, {
    VERCEL: '1',
    VERCEL_URL: 'trip-preview.vercel.app',
    MONGO_URI: mongo.getUri(),
    MONGO_DB_NAME: 'vercel-test',
    JWT_ACCESS_SECRET: randomBytes(48).toString('hex'),
    JWT_REFRESH_SECRET: randomBytes(48).toString('hex'),
    AUDIT_LOG_ENABLED: 'false',
    DOCS_ENABLED: 'true',
    FRONTEND_BASE_URL: '',
    CORS_ORIGIN: '',
  })
  try {
    const { default: handler } = await import('../../api/index.js')
    const responses = await Promise.all([
      request(handler).get('/health'),
      request(handler).get('/api/v1/health'),
    ])
    for (const response of responses) {
      assert.equal(response.statusCode, 200)
      assert.equal(response.body.data.database, 'connected')
    }
    const missing = await request(handler).get('/api/v1/missing')
    assert.equal(missing.statusCode, 404)
    assert.equal(missing.body.success, false)
    const spec = await request(handler).get('/api/v1/openapi.json')
    assert.equal(spec.statusCode, 200)
    assert.equal(spec.body.servers[0].url, '/api/v1')
    const preflight = await request(handler).options('/api/v1/trips')
      .set('Origin', 'https://trip-preview.vercel.app')
      .set('Access-Control-Request-Method', 'POST')
    assert.equal(preflight.headers['access-control-allow-origin'], 'https://trip-preview.vercel.app')
  } finally {
    await mongoose.disconnect()
    await mongo.stop()
  }
})
