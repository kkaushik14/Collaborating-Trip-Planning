import { z } from 'zod'

import {
  emailSchema,
  objectIdSchema,
  roleSchema,
} from './schema-utils.js'

const inviteMemberSchema = z.object({
  email: emailSchema,
  role: roleSchema.default('VIEWER'),
})

const commentBodySchema = z
  .string()
  .trim()
  .min(1, 'Comment cannot be empty')
  .max(1000, 'Comment cannot exceed 1000 characters')

const commentSchema = z
  .object({
    body: commentBodySchema,
    targetType: z.enum(['day', 'activity']).default('day'),
    dayId: objectIdSchema.optional(),
    activityId: objectIdSchema.optional(),
    parentCommentId: objectIdSchema.optional(),
  })
  .superRefine((value, context) => {
    if (value.targetType === 'day' && !value.dayId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dayId is required when targetType is day',
        path: ['dayId'],
      })
    }

    if (value.targetType === 'activity' && !value.activityId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'activityId is required when targetType is activity',
        path: ['activityId'],
      })
    }
  })

const commentInputSchema = z.object({
  body: commentBodySchema,
})

const memberRoleUpdateSchema = z.object({
  role: roleSchema,
})

export {
  commentInputSchema,
  commentSchema,
  inviteMemberSchema,
  memberRoleUpdateSchema,
}
