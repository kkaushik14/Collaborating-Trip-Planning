import { User } from '../models/index.js'
import {
  clearRefreshToken,
  issueAuthTokens,
  isRefreshTokenValid,
  sendWelcomeEmail,
  verifyRefreshToken,
} from '../services/index.js'
import { ApiError, ApiResponse, asyncHandler, resolveFrontendBaseUrl } from '../utils/index.js'

const EMAIL_UPDATE_LIMIT = 2
const normalizeMobileNumber = (value) => {
  if (value === null || value === undefined) {
    return null
  }

  const normalized = String(value).trim()
  return normalized ? normalized : null
}

const normalizeAvatarUrl = (value) => {
  if (value === null || value === undefined) {
    return null
  }

  const normalized = String(value).trim()
  return normalized ? normalized : null
}

const serializeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  isActive: user.isActive,
  avatarUrl: user.avatarUrl || null,
  mobileNumber: user.mobileNumber || null,
  themePreference: user.themePreference === 'light' ? 'light' : 'dark',
  emailUpdateCount: Number(user.emailUpdateCount || 0),
  emailUpdateLimit: EMAIL_UPDATE_LIMIT,
  emailUpdatesRemaining: Math.max(0, EMAIL_UPDATE_LIMIT - Number(user.emailUpdateCount || 0)),
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
    .json(new ApiResponse(200, { user: serializeUser(req.user) }, 'Current user fetched successfully'))
})

const updateCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.actorId)

  if (!user || !user.isActive) {
    throw ApiError.notFound('User not found')
  }

  const { name, email, mobileNumber, avatarUrl, themePreference } = req.body

  if (name !== undefined) {
    const normalizedName = String(name || '').trim()
    if (!normalizedName) {
      throw ApiError.badRequest('name cannot be empty')
    }
    user.name = normalizedName
  }

  if (email !== undefined) {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!normalizedEmail) {
      throw ApiError.badRequest('email cannot be empty')
    }

    if (normalizedEmail !== user.email) {
      if (Number(user.emailUpdateCount || 0) >= EMAIL_UPDATE_LIMIT) {
        throw ApiError.badRequest('Email update limit reached for this account')
      }

      const existingEmailUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      }).select('_id')

      if (existingEmailUser) {
        throw ApiError.conflict('A user with this email already exists')
      }

      user.email = normalizedEmail
      user.emailUpdateCount = Number(user.emailUpdateCount || 0) + 1
    }
  }

  if (mobileNumber !== undefined) {
    user.mobileNumber = normalizeMobileNumber(mobileNumber)
  }

  if (avatarUrl !== undefined) {
    user.avatarUrl = normalizeAvatarUrl(avatarUrl)
  }

  if (themePreference !== undefined) {
    user.themePreference = themePreference === 'light' ? 'light' : 'dark'
  }

  await user.save()

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: serializeUser(user),
      },
      'Profile updated successfully',
    ),
  )
})

export { getCurrentUser, login, logout, refreshToken, register, updateCurrentUserProfile }
