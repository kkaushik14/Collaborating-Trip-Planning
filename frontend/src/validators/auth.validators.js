import { z } from 'zod'

import { emailSchema } from './schema-utils.js'

const signInSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters'),
})

const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name cannot exceed 80 characters'),
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

export { refreshTokenSchema, signInSchema, signUpSchema }
