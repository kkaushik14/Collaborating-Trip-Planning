import { z } from 'zod'

import {
  currencyCodeSchema,
  isoDateStringSchema,
  objectIdSchema,
} from './schema-utils.js'

const checklistSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Checklist title must be at least 2 characters')
    .max(120, 'Checklist title cannot exceed 120 characters'),
  type: z
    .string()
    .trim()
    .min(2, 'Checklist type is required')
    .max(40, 'Checklist type cannot exceed 40 characters'),
})

const checklistItemSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, 'Item label is required')
    .max(200, 'Item label cannot exceed 200 characters'),
  isCompleted: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).optional(),
})

const attachmentMetadataSchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(1, 'File name is required')
    .max(255, 'File name cannot exceed 255 characters'),
  mimeType: z
    .string()
    .trim()
    .min(1, 'MIME type is required')
    .max(120, 'MIME type cannot exceed 120 characters'),
  sizeBytes: z.coerce
    .number()
    .int('File size must be a whole number')
    .min(1, 'File size must be greater than 0'),
  url: z.string().trim().min(1, 'File URL is required'),
})

const reservationSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, 'Reservation title must be at least 2 characters')
      .max(120, 'Reservation title cannot exceed 120 characters'),
    reservationType: z
      .string()
      .trim()
      .min(2, 'Reservation type is required')
      .max(40, 'Reservation type cannot exceed 40 characters'),
    providerName: z
      .string()
      .trim()
      .max(120, 'Provider name cannot exceed 120 characters')
      .optional()
      .or(z.literal('')),
    confirmationCode: z
      .string()
      .trim()
      .max(120, 'Confirmation code cannot exceed 120 characters')
      .optional()
      .or(z.literal('')),
    startDateTime: isoDateStringSchema,
    endDateTime: isoDateStringSchema,
    amount: z.coerce.number().min(0, 'Amount cannot be negative').optional(),
    currency: currencyCodeSchema.optional(),
    notes: z
      .string()
      .trim()
      .max(1000, 'Notes cannot exceed 1000 characters')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (value) =>
      new Date(value.endDateTime).getTime() >= new Date(value.startDateTime).getTime(),
    {
      message: 'Reservation end time must be after start time',
      path: ['endDateTime'],
    },
  )

const expenseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Expense title must be at least 2 characters')
    .max(120, 'Expense title cannot exceed 120 characters'),
  category: z
    .string()
    .trim()
    .min(2, 'Expense category is required')
    .max(40, 'Expense category cannot exceed 40 characters'),
  amount: z.coerce.number().positive('Expense amount must be greater than zero'),
  currency: currencyCodeSchema,
  expenseDate: isoDateStringSchema,
  paidBy: objectIdSchema.optional(),
  notes: z
    .string()
    .trim()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .optional()
    .or(z.literal('')),
})

const budgetSchema = z.object({
  currency: currencyCodeSchema,
  totalBudget: z.coerce.number().positive('Total budget must be greater than zero'),
  categoryLimits: z
    .array(
      z.object({
        category: z.string().trim().min(2).max(40),
        limit: z.coerce.number().min(0, 'Category limit cannot be negative'),
      }),
    )
    .optional(),
})

export {
  attachmentMetadataSchema,
  budgetSchema,
  checklistItemSchema,
  checklistSchema,
  expenseSchema,
  reservationSchema,
}
