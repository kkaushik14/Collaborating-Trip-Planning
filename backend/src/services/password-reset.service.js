import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'

import { env } from '../config/index.js'
import { User } from '../models/index.js'
import { ApiError, keepAlive } from '../utils/index.js'
import { sendPasswordResetEmail } from './mail.service.js'

const RESET_TTL_MS = 30 * 60 * 1000
const RESET_COOLDOWN_MS = 60 * 1000
const pendingRequests = new Set()
const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

const deliverPasswordReset = async (email) => {
  // Never trust Origin/Host/forwarding headers when constructing a credential link.
  const resetUrl = new URL(`${env.frontendBaseUrl.replace(/\/+$/, '')}/reset-password`)
  if (!['http:', 'https:'].includes(resetUrl.protocol) || resetUrl.username || resetUrl.password ||
      resetUrl.search || resetUrl.hash ||
      ((env.nodeEnv === 'production' || env.isVercel) && resetUrl.protocol !== 'https:')) {
    throw new Error('Invalid frontend base URL')
  }
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashResetToken(token)
  const now = new Date()
  const user = await User.findOneAndUpdate({
    email,
    isActive: true,
    $or: [
      { passwordResetRequestedAt: { $exists: false } },
      { passwordResetRequestedAt: null },
      { passwordResetRequestedAt: { $lte: new Date(now.getTime() - RESET_COOLDOWN_MS) } },
    ],
  }, {
    $set: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: new Date(now.getTime() + RESET_TTL_MS),
      passwordResetRequestedAt: now,
      passwordResetEmail: email,
    },
  }, { new: true }).select('email').lean()

  if (!user) return
  resetUrl.searchParams.set('token', token)
  try {
    await sendPasswordResetEmail({ email: user.email, resetUrl: resetUrl.toString() })
  } catch (_error) {
    // A failed delivery must not clear a newer request's token.
    await User.updateOne({ _id: user._id, passwordResetTokenHash: tokenHash }, {
      $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1, passwordResetEmail: 1 },
    })
    throw new Error('Password reset email delivery failed')
  }
}

const requestPasswordReset = (email) => {
  // Detach both the account lookup and SMTP latency from the public response.
  const work = Promise.resolve().then(() => deliverPasswordReset(email))
    .catch(() => console.error('Password reset request could not be completed'))
  pendingRequests.add(work)
  void work.finally(() => pendingRequests.delete(work))
  keepAlive(work)
}

const drainPasswordResetRequests = async () => {
  await Promise.all([...pendingRequests])
}

const resetUserPassword = async ({ token, password }) => {
  // Query updates bypass the model's save hook; hash explicitly before the atomic write.
  const passwordHash = await bcrypt.hash(password, 10)
  const result = await User.updateOne({
    passwordResetTokenHash: hashResetToken(token),
    passwordResetExpiresAt: { $gt: new Date() },
    isActive: true,
    $expr: { $eq: ['$email', '$passwordResetEmail'] },
  }, {
    $set: { password: passwordHash, refreshTokenHash: null },
    $inc: { authVersion: 1 },
    $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1, passwordResetEmail: 1 },
  })
  if (!result.matchedCount) {
    throw ApiError.badRequest('Invalid or expired password reset token')
  }
}

export { drainPasswordResetRequests, requestPasswordReset, resetUserPassword }
