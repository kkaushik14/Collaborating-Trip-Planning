import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { format } from 'node:util'

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import nodemailer from 'nodemailer'
import morgan from 'morgan'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'

// Set configuration before importing the application; never connect to a configured real DB.
Object.assign(process.env, {
  NODE_ENV: 'test', VERCEL: '0', AUDIT_LOG_ENABLED: 'false',
  FRONTEND_BASE_URL: 'https://trusted.example.com',
  AUTH_RATE_LIMIT_MAX: '8', RATE_LIMIT_MAX: '10000',
  SMTP_HOST: '', SMTP_USER: '', SMTP_PASS: '',
  UPLOAD_DIR: '/tmp/trip-planning-password-reset-tests',
})

let app, User, env, services, mongo
let mails = [], logs = [], mailError = null, mailGate = null
let ip = 0
const hash = (token) => createHash('sha256').update(token).digest('hex')
const oldPassword = 'OriginalPassword123!'
const newPassword = 'NewPassword456!'
const api = (path) => request(app).post(`/api/v1/auth/${path}`).set('X-Forwarded-For', `192.0.2.${++ip}`)
const createUser = (extra = {}) => User.create({ name: 'Reset User', email: 'reset@example.com', password: oldPassword, ...extra })
const getMailToken = (mail = mails.at(-1)) => new URL(mail.text.match(/Reset Password: (\S+)/)[1]).searchParams.get('token')
const askForReset = async (email = 'reset@example.com') => {
  const response = await api('forgot-password').send({ email })
  assert.equal(response.status, 200)
  await services.drainPasswordResetRequests()
  return response
}
const allowResend = (id) => User.updateOne({ _id: id }, { $set: { passwordResetRequestedAt: new Date(Date.now() - 61000) } })
const assertPrivateResponse = (response, ...secrets) => {
  for (const secret of secrets) assert.ok(!response.text.includes(secret), 'response must not contain a secret')
  assert.equal(response.body.data, null)
  assert.equal(response.body.tokens, undefined)
}

test.before(async () => {
  test.mock.method(console, 'log', (...args) => logs.push(format(...args)))
  test.mock.method(console, 'error', (...args) => logs.push(format(...args)))
  test.mock.method(nodemailer, 'createTransport', () => ({
    sendMail: async (mail) => {
      const deliveryError = mailError
      const deliveryGate = mailGate
      mails.push(mail)
      if (deliveryGate) await deliveryGate
      if (deliveryError) throw deliveryError
      // Provider previews can contain the entire message, even outside JSON transport.
      return { message: JSON.stringify(mail) }
    },
  }))
  ;({ app } = await import('../src/app.js'))
  ;({ User } = await import('../src/models/index.js'))
  ;({ env } = await import('../src/config/index.js'))
  services = await import('../src/services/index.js')
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri(), { dbName: 'password-reset-test' })
})

test.beforeEach(async () => {
  await services.drainPasswordResetRequests()
  await User.deleteMany({})
  mails = []; logs = []; mailError = null; mailGate = null
})

test.after(async () => {
  await services?.drainPasswordResetRequests()
  await mongoose.disconnect()
  await mongo?.stop()
  test.mock.restoreAll()
})

test('generic response for known, unknown, inactive and cooldown requests; mail uses configured URL only', async () => {
  const user = await createUser()
  await createUser({ email: 'inactive@example.com', isActive: false })
  const start = Date.now()
  const known = await api('forgot-password')
    .set('Origin', 'https://attacker.example.com')
    .set('Host', 'attacker.example.com')
    .set('X-Forwarded-Host', 'attacker.example.com')
    .send({ email: '  RESET@EXAMPLE.COM  ' })
  await services.drainPasswordResetRequests()
  assert.equal(known.status, 200)
  assert.equal(known.headers['cache-control'], 'no-store')
  for (const email of ['missing@example.com', 'inactive@example.com', 'reset@example.com']) {
    const other = await askForReset(email)
    assert.deepEqual(other.body, known.body)
  }
  assert.equal(mails.length, 1)
  assert.equal(mails[0].to, user.email)
  const token = getMailToken()
  assert.match(token, /^[a-f0-9]{64}$/)
  assert.ok(mails[0].html.includes(`https://trusted.example.com/reset-password?token=${token}`))
  assert.match(mails[0].text, /30 minutes/)
  const stored = await User.findById(user._id).select('+passwordResetTokenHash +passwordResetExpiresAt').lean()
  assert.equal(stored.passwordResetTokenHash, hash(token))
  assert.notEqual(stored.passwordResetTokenHash, token)
  assert.ok(stored.passwordResetExpiresAt.getTime() >= start + 30 * 60 * 1000)
  assert.ok(stored.passwordResetExpiresAt.getTime() <= Date.now() + 30 * 60 * 1000)
  const publicUser = await User.findById(user._id).lean()
  for (const field of ['passwordResetTokenHash', 'passwordResetExpiresAt', 'passwordResetEmail', 'passwordResetRequestedAt']) {
    assert.equal(publicUser[field], undefined)
  }
  assertPrivateResponse(known, token, hash(token))
  assert.ok(!logs.join('\n').includes(token))
})

test('public acknowledgment does not wait for account lookup or mail delivery', async () => {
  await createUser()
  let releaseLookup, releaseMail
  const lookupGate = new Promise((resolve) => { releaseLookup = resolve })
  mailGate = new Promise((resolve) => { releaseMail = resolve })
  const original = User.findOneAndUpdate.bind(User)
  const lookupMock = test.mock.method(User, 'findOneAndUpdate', (...args) => ({
    select: () => ({ lean: async () => { await lookupGate; return original(...args).select('email').lean() } }),
  }))
  try {
    const known = await api('forgot-password').send({ email: 'reset@example.com' }).timeout(2000)
    const unknown = await api('forgot-password').send({ email: 'absent@example.com' }).timeout(2000)
    assert.deepEqual(known.body, unknown.body)
    assert.equal(mails.length, 0)
    releaseLookup()
    const whileMailBlocked = await api('forgot-password').send({ email: 'reset@example.com' }).timeout(2000)
    assert.equal(whileMailBlocked.status, 200)
  } finally {
    releaseLookup(); releaseMail()
    await services.drainPasswordResetRequests()
    lookupMock.mock.restore()
  }
})

test('mail failure is generic, clears only the failed token and never logs provider secrets', async () => {
  const user = await createUser()
  mailError = new Error('SMTP failed with secret-token and secret-password')
  const failed = await askForReset()
  const token = getMailToken()
  const absent = await askForReset('absent@example.com')
  assert.deepEqual(failed.body, absent.body)
  const stored = await User.findById(user._id).select('+passwordResetTokenHash +passwordResetExpiresAt')
  assert.equal(stored.passwordResetTokenHash, undefined)
  assert.equal(stored.passwordResetExpiresAt, undefined)
  for (const secret of [token, 'secret-token', 'secret-password']) assert.ok(!logs.join('\n').includes(secret))
  const retry = await api('reset-password').send({ token, password: newPassword })
  assert.equal(retry.status, 400)
})

test('successful reset hashes password, consumes token, revokes sessions and does not log in', async () => {
  const user = await createUser()
  const tokens = await services.issueAuthTokens(user)
  const legacyAccess = jwt.sign({ sub: user.id, email: user.email }, env.jwtAccessSecret, { expiresIn: '1h' })
  assert.equal((await request(app).get('/api/v1/auth/me').auth(legacyAccess, { type: 'bearer' })).status, 200)
  const staleUser = await User.findById(user.id).select('+password +refreshTokenHash')
  await askForReset()
  const token = getMailToken()
  const reset = await api('reset-password').send({ token, password: newPassword })
  assert.equal(reset.status, 200)
  assertPrivateResponse(reset, token, newPassword)
  const stored = await User.findById(user.id).select('+password +refreshTokenHash +passwordResetTokenHash +passwordResetExpiresAt')
  assert.ok(await bcrypt.compare(newPassword, stored.password))
  assert.equal(await bcrypt.compare(oldPassword, stored.password), false)
  assert.equal(stored.refreshTokenHash, null)
  assert.equal(stored.authVersion, 1)
  assert.equal(stored.passwordResetTokenHash, undefined)
  assert.equal(stored.passwordResetExpiresAt, undefined)
  for (const access of [tokens.accessToken, legacyAccess]) {
    assert.equal((await request(app).get('/api/v1/auth/me').auth(access, { type: 'bearer' })).status, 401)
  }
  assert.equal((await api('refresh').send({ refreshToken: tokens.refreshToken })).status, 401)
  await assert.rejects(services.issueAuthTokens(staleUser), /Credentials changed/)
  assert.equal((await api('login').send({ email: user.email, password: oldPassword })).status, 401)
  const login = await api('login').send({ email: user.email, password: newPassword })
  assert.equal(login.status, 200)
  assert.equal((await request(app).get('/api/v1/auth/me').auth(login.body.data.tokens.accessToken, { type: 'bearer' })).status, 200)
  assert.equal((await api('refresh').send({ refreshToken: login.body.data.tokens.refreshToken })).status, 200)
  assert.equal((await api('reset-password').send({ token, password: oldPassword })).status, 400)
})

test('late failure of an older email cannot remove a newer reset token', async () => {
  const user = await createUser()
  let releaseMail
  mailGate = new Promise((resolve) => { releaseMail = resolve })
  mailError = new Error('older delivery failed')
  try {
    await api('forgot-password').send({ email: user.email })
    const deadline = Date.now() + 2000
    while (!mails.length && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 5))
    assert.equal(mails.length, 1)
    await allowResend(user.id)
    mailGate = null; mailError = null
    await api('forgot-password').send({ email: user.email })
    while (mails.length < 2 && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 5))
    assert.equal(mails.length, 2)
  } finally {
    releaseMail()
    await services.drainPasswordResetRequests()
  }
  const token = getMailToken()
  assert.equal((await User.findById(user.id).select('+passwordResetTokenHash')).passwordResetTokenHash, hash(token))
  assert.equal((await api('reset-password').send({ token, password: newPassword })).status, 200)
})

test('production reset links require HTTPS and invalid configuration remains enumeration-safe', async () => {
  await createUser()
  const originalNodeEnv = env.nodeEnv
  const originalBaseUrl = env.frontendBaseUrl
  try {
    env.nodeEnv = 'production'
    env.frontendBaseUrl = 'http://trusted.example.com'
    const known = await askForReset()
    const unknown = await askForReset('missing@example.com')
    assert.deepEqual(known.body, unknown.body)
    assert.equal(mails.length, 0)
  } finally {
    env.nodeEnv = originalNodeEnv
    env.frontendBaseUrl = originalBaseUrl
  }
})

test('legacy database records and refresh tokens are revoked on reset', async () => {
  const user = await createUser()
  const refreshToken = jwt.sign({ sub: user.id, email: user.email }, env.jwtRefreshSecret, { expiresIn: '1h' })
  await User.collection.updateOne({ _id: user._id }, { $unset: { authVersion: '' }, $set: { refreshTokenHash: hash(refreshToken) } })
  const legacyUser = await User.findById(user.id)
  await services.issueAuthTokens(legacyUser)
  await askForReset()
  assert.equal((await api('reset-password').send({ token: getMailToken(), password: newPassword })).status, 200)
  legacyUser.name = 'Updated profile after reset'
  await legacyUser.save()
  assert.equal((await User.findById(user.id)).authVersion, 1)
  // Even a stale writer restoring a refresh hash cannot restore the prior credential version.
  await User.updateOne({ _id: user.id }, { $set: { refreshTokenHash: hash(refreshToken) } })
  assert.equal((await api('refresh').send({ refreshToken })).status, 401)
})

test('concurrent reset attempts consume a token exactly once', async () => {
  const user = await createUser()
  await askForReset()
  const token = getMailToken()
  const passwords = ['ConcurrentWinnerOne!', 'ConcurrentWinnerTwo!']
  const responses = await Promise.all(passwords.map((password) => api('reset-password').send({ token, password })))
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 400])
  const stored = await User.findById(user.id).select('+password')
  assert.equal(stored.authVersion, 1)
  assert.ok(await stored.isPasswordCorrect(passwords[responses.findIndex((response) => response.status === 200)]))
})

test('resend invalidates the old link and simultaneous requests enforce account cooldown', async () => {
  const user = await createUser()
  await Promise.all(Array.from({ length: 4 }, () => api('forgot-password').send({ email: user.email })))
  await services.drainPasswordResetRequests()
  assert.equal(mails.length, 1)
  const firstToken = getMailToken()
  await allowResend(user.id)
  await askForReset()
  const secondToken = getMailToken()
  assert.notEqual(firstToken, secondToken)
  assert.equal((await api('reset-password').send({ token: firstToken, password: newPassword })).status, 400)
  assert.equal((await api('reset-password').send({ token: secondToken, password: newPassword })).status, 200)
})

test('expired, inactive, wrong and changed-email tokens fail without changing password', async () => {
  const user = await createUser()
  await askForReset()
  const token = getMailToken()
  const invalid = await api('reset-password').send({ token: '0'.repeat(64), password: newPassword })
  const mutations = [
    { passwordResetExpiresAt: new Date(Date.now() - 1) },
    { passwordResetExpiresAt: new Date(Date.now() + 60000), isActive: false },
    { isActive: true, email: 'changed@example.com' },
  ]
  for (const mutation of mutations) {
    await User.updateOne({ _id: user.id }, { $set: mutation })
    const response = await api('reset-password').send({ token, password: newPassword })
    assert.equal(response.status, 400)
    assert.deepEqual(response.body, invalid.body)
  }
  const stored = await User.findById(user.id).select('+password')
  assert.ok(await stored.isPasswordCorrect(oldPassword))
  assert.equal(stored.authVersion || 0, 0)
})

test('validation and parser errors do not echo tokens or passwords; invalid passwords do not consume token', async () => {
  await createUser()
  await askForReset()
  const token = getMailToken()
  const invalidBodies = [
    {}, { token }, { token: { $ne: null }, password: newPassword },
    { token: 'secret-invalid-token', password: newPassword },
    { token, password: 'short' }, { token, password: 'x'.repeat(73) },
    { token, password: '\u00e9'.repeat(37) },
  ]
  for (const body of invalidBodies) {
    const response = await api('reset-password').send(body)
    assert.equal(response.status, 400)
    assertPrivateResponse(response, token, newPassword, 'secret-invalid-token')
    assert.equal(response.body.meta, undefined)
  }
  const malformed = await api('reset-password').set('Content-Type', 'application/json')
    .send(`{"token":"${token}","password":"${newPassword}",`)
  assert.equal(malformed.status, 400)
  assertPrivateResponse(malformed, token, newPassword)
  for (const body of [{}, { email: 'not-an-email' }, { email: { $ne: null } }]) {
    assert.equal((await api('forgot-password').send(body)).status, 400)
  }
  const validPassword = ` ${'x'.repeat(70)} `
  assert.equal((await api('reset-password').send({ token, password: validPassword })).status, 200)
  const stored = await User.findOne({ email: 'reset@example.com' }).select('+password')
  assert.ok(await stored.isPasswordCorrect(validPassword))
})

test('database failures return sanitized errors and leave reset token usable', async () => {
  await createUser()
  await askForReset()
  const token = getMailToken()
  const updateMock = test.mock.method(User, 'updateOne', async () => { throw new Error(`${token} ${newPassword}`) })
  try {
    const response = await api('reset-password').send({ token, password: newPassword })
    assert.equal(response.status, 500)
    assertPrivateResponse(response, token, newPassword)
    assert.equal(response.body.meta, undefined)
  } finally { updateMock.mock.restore() }
  assert.equal((await api('reset-password').send({ token, password: newPassword })).status, 200)
})

test('recovery endpoints share a per-IP rate limit before input validation', async () => {
  for (let index = 0; index < 8; index++) {
    const path = index % 2 ? 'reset-password' : 'forgot-password'
    const response = await request(app).post(`/api/v1/auth/${path}`).set('X-Forwarded-For', '198.51.100.1').send({})
    assert.equal(response.status, 400)
  }
  const blocked = await request(app).post('/api/v1/auth/forgot-password')
    .set('X-Forwarded-For', '198.51.100.1').send({ email: 'unknown@example.com' })
  assert.equal(blocked.status, 429)
  assert.ok(blocked.headers['retry-after'])
  assert.equal(mails.length, 0)
})

test('request logs strip query secrets and OpenAPI documents public recovery contracts', async () => {
  assert.equal(morgan['safe-url']({ originalUrl: '/api/v1/auth/reset-password?token=secret' }), '/api/v1/auth/reset-password')
  assert.equal(morgan['safe-referrer']({ headers: { referer: 'https://trusted.example.com/reset-password?token=secret' } }), 'https://trusted.example.com/reset-password')
  const response = await request(app).get('/api/v1/openapi.json')
  for (const path of ['/auth/forgot-password', '/auth/reset-password']) {
    const operation = response.body.paths[path].post
    assert.deepEqual(operation.security, [])
    for (const code of ['200', '400', '429']) assert.ok(operation.responses[code])
  }
  assert.match(response.body.paths['/auth/forgot-password'].post.externalDocs.url, /owasp/)
  const missingRoute = await request(app).get('/reset-password?token=secret-link-token')
  assert.equal(missingRoute.status, 404)
  assertPrivateResponse(missingRoute, 'secret-link-token')
})
