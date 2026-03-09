import crypto from 'node:crypto'

import jwt from 'jsonwebtoken'

import { env } from '../config/index.js'

const buildTokenPayload = (user) => ({
  sub: user._id.toString(),
  email: user.email,
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

  user.refreshTokenHash = hashToken(refreshToken)
  await user.save({ validateBeforeSave: false })

  return { accessToken, refreshToken }
}

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwtAccessSecret)
}

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.jwtRefreshSecret)
}

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
  isRefreshTokenValid,
  issueAuthTokens,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
}
