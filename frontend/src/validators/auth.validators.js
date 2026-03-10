import { z } from 'zod'

import { emailSchema } from './schema-utils.js'

const signInSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters'),
})

const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .trim()
    .min(10, 'Refresh token is required'),
})

export { refreshTokenSchema, signInSchema }
