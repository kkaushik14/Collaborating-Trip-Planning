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

const profileMobileSchema = z
  .string()
  .trim()
  .max(20, 'Mobile number cannot exceed 20 characters')
  .refine((value) => !value || /^[0-9+\-()\s]{7,20}$/.test(value), {
    message: 'Mobile number must be 7-20 digits and may include +, -, spaces, or parentheses',
  })

const profileAvatarSchema = z
  .string()
  .trim()
  .refine((value) => !value || /^https?:\/\/.+/i.test(value), {
    message: 'Avatar URL must start with http:// or https://',
  })

const profileSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(120, 'Name cannot exceed 120 characters'),
  email: emailSchema,
  mobileNumber: profileMobileSchema.optional().default(''),
  avatarUrl: profileAvatarSchema.optional().default(''),
})

export { profileSettingsSchema, refreshTokenSchema, signInSchema, signUpSchema }
