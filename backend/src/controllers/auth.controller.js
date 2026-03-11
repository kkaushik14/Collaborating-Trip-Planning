import { User } from '../models/index.js'
import {
  clearRefreshToken,
  issueAuthTokens,
  isRefreshTokenValid,
  sendWelcomeEmail,
  verifyRefreshToken,
} from '../services/index.js'
import { ApiError, ApiResponse, asyncHandler, resolveFrontendBaseUrl } from '../utils/index.js'

const serializeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !name.trim()) {
    throw ApiError.badRequest('name is required')
  }

  if (!email || !email.trim()) {
    throw ApiError.badRequest('email is required')
  }

  if (!password || password.length < 8) {
    throw ApiError.badRequest('password must be at least 8 characters')
  }

  const normalizedEmail = email.toLowerCase().trim()

  const existingUser = await User.findOne({ email: normalizedEmail }).select('_id').lean()
  if (existingUser) {
    throw ApiError.conflict('A user with this email already exists')
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
  })

  const { accessToken, refreshToken } = await issueAuthTokens(user)

  void sendWelcomeEmail({
    email: user.email,
    recipientName: user.name || 'Traveler',
    appUrl: resolveFrontendBaseUrl(req),
  }).catch((error) => {
    console.error('Failed to send welcome email after registration:', error)
  })

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: serializeUser(user),
        tokens: {
          accessToken,
          refreshToken,
        },
      },
      'User registered successfully',
    ),
  )
})

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw ApiError.badRequest('email and password are required')
  }

  const normalizedEmail = email.toLowerCase().trim()

  const user = await User.findOne({ email: normalizedEmail }).select('+password +refreshTokenHash')
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid credentials')
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password)
  if (!isPasswordCorrect) {
    throw ApiError.unauthorized('Invalid credentials')
  }

  user.lastLoginAt = new Date()

  const { accessToken, refreshToken } = await issueAuthTokens(user)

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: serializeUser(user),
        tokens: {
          accessToken,
          refreshToken,
        },
      },
      'Login successful',
    ),
  )
})

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: providedToken } = req.body

  if (!providedToken) {
    throw ApiError.badRequest('refreshToken is required')
  }

  let payload

  try {
    payload = verifyRefreshToken(providedToken)
  } catch (_error) {
    throw ApiError.unauthorized('Invalid or expired refresh token')
  }

  const user = await User.findById(payload.sub).select('+refreshTokenHash')

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid user for refresh token')
  }

  if (!isRefreshTokenValid(user, providedToken)) {
    throw ApiError.unauthorized('Refresh token is invalid')
  }

  const { accessToken, refreshToken: rotatedRefreshToken } = await issueAuthTokens(user)

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        tokens: {
          accessToken,
          refreshToken: rotatedRefreshToken,
        },
      },
      'Token refreshed successfully',
    ),
  )
})

const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.actorId).select('+refreshTokenHash')

  if (user) {
    await clearRefreshToken(user)
  }

  return res.status(200).json(new ApiResponse(200, null, 'Logout successful'))
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { user: req.user }, 'Current user fetched successfully'))
})

export { getCurrentUser, login, logout, refreshToken, register }
