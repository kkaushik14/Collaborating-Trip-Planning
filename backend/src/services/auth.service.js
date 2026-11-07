import crypto from 'node:crypto'

import jwt from 'jsonwebtoken'

import { env } from '../config/index.js'
import { User } from '../models/index.js'
import { ApiError } from '../utils/index.js'

const buildTokenPayload = (user) => ({
  sub: user._id.toString(),
  email: user.email,
  ver: user.authVersion || 0,
})

const signAccessToken = (user) => {
  return jwt.sign(buildTokenPayload(user), env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn,
  })
}

const signRefreshToken = (user) => {
  return jwt.sign(buildTokenPayload(user), env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  })
}

const hashToken = (value) => {
  return crypto.createHash('sha256').update(value).digest('hex')
}

const issueAuthTokens = async (user) => {
  const accessToken = signAccessToken(user)
  const refreshToken = signRefreshToken(user)

  // Do not let a login/refresh that started before a reset restore a revoked session.
  const version = user.authVersion || 0
  const result = await User.updateOne({
    _id: user._id,
    isActive: true,
    ...(version === 0
      ? { $or: [{ authVersion: 0 }, { authVersion: { $exists: false } }] }
      : { authVersion: version }),
  }, {
    $set: {
      refreshTokenHash: hashToken(refreshToken),
      ...(user.isModified('lastLoginAt') ? { lastLoginAt: user.lastLoginAt } : {}),
    },
  })
  if (!result.matchedCount) {
    throw ApiError.unauthorized('Credentials changed; please log in again')
  }

  return { accessToken, refreshToken }
}

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwtAccessSecret)
}

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.jwtRefreshSecret)
}

// Tokens issued before credential versioning are valid only until the first reset.
const isAuthVersionValid = (user, payload) => (payload.ver ?? 0) === (user.authVersion || 0)

const isRefreshTokenValid = (user, refreshToken) => {
  if (!user.refreshTokenHash) {
    return false
  }

  return user.refreshTokenHash === hashToken(refreshToken)
}

const clearRefreshToken = async (user) => {
  user.refreshTokenHash = null
  await user.save({ validateBeforeSave: false })
}

export {
  clearRefreshToken,
  isAuthVersionValid,
  isRefreshTokenValid,
  issueAuthTokens,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
}
