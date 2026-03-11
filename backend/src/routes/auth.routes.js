import express from 'express'

import {
  getCurrentUser,
  login,
  logout,
  refreshToken,
  register,
  updateCurrentUserProfile,
} from '../controllers/index.js'
import { authRateLimiter, authenticate } from '../middlewares/index.js'
import { authSchemas, validateRequest } from '../validators/index.js'

const authRouter = express.Router()

authRouter.post(
  '/register',
  authRateLimiter,
  validateRequest({ body: authSchemas.register }),
  register,
)
authRouter.post('/login', authRateLimiter, validateRequest({ body: authSchemas.login }), login)
authRouter.post(
  '/refresh',
  authRateLimiter,
  validateRequest({ body: authSchemas.refresh }),
  refreshToken,
)
authRouter.post('/logout', authenticate, logout)
authRouter.get('/me', authenticate, getCurrentUser)
authRouter.patch(
  '/me',
  authenticate,
  validateRequest({ body: authSchemas.updateProfile }),
  updateCurrentUserProfile,
)

export { authRouter }
