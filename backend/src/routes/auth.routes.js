import express from 'express'

import {
  forgotPassword,
  resetPassword,
  getCurrentUser,
  login,
  logout,
  refreshToken,
  register,
  updateCurrentUserProfile,
} from '../controllers/index.js'
import { authRateLimiter, authenticate, passwordRecoveryRateLimiter } from '../middlewares/index.js'
import { authSchemas, validateRequest } from '../validators/index.js'

const authRouter = express.Router()

authRouter.use(['/forgot-password', '/reset-password'], (_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  res.set('Referrer-Policy', 'no-referrer')
  next()
})
authRouter.post('/forgot-password', passwordRecoveryRateLimiter,
  validateRequest({ body: authSchemas.forgotPassword }), forgotPassword)
authRouter.post('/reset-password', passwordRecoveryRateLimiter,
  validateRequest({ body: authSchemas.resetPassword }), resetPassword)

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
