import { z } from 'zod'

import {
  currencyCodeSchema,
  isoDateStringSchema,
  objectIdSchema,
} from './schema-utils.js'

const tripCreateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Trip title must be at least 3 characters')
      .max(120, 'Trip title cannot exceed 120 characters'),
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional()
      .or(z.literal('')),
    startDate: isoDateStringSchema,
    endDate: isoDateStringSchema,
    travelerCount: z.coerce
      .number()
      .int('Traveler count must be a whole number')
      .min(1, 'At least 1 traveler is required')
      .max(100, 'Traveler count cannot exceed 100'),
    currency: currencyCodeSchema.default('USD'),
    timezone: z.string().trim().min(2).max(80).optional(),
  })
  .refine(
    (value) => new Date(value.endDate).getTime() >= new Date(value.startDate).getTime(),
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    },
  )

const itineraryDaySchema = z.object({
  dayNumber: z.coerce
    .number()
    .int('Day number must be a whole number')
    .min(1, 'Day number must start from 1')
    .max(365, 'Day number cannot exceed 365'),
  date: isoDateStringSchema,
  title: z
    .string()
    .trim()
    .min(2, 'Day title must be at least 2 characters')
    .max(120, 'Day title cannot exceed 120 characters'),
  notes: z
    .string()
    .trim()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .optional()
    .or(z.literal('')),
})

const activityCardSchema = z
  .object({
    dayId: objectIdSchema.optional(),
    title: z
      .string()
      .trim()
      .min(2, 'Activity title must be at least 2 characters')
      .max(120, 'Activity title cannot exceed 120 characters'),
    description: z
      .string()
      .trim()
      .max(1000, 'Description cannot exceed 1000 characters')
      .optional()
      .or(z.literal('')),
    locationName: z
      .string()
      .trim()
      .max(200, 'Location cannot exceed 200 characters')
      .optional()
      .or(z.literal('')),
    startTime: isoDateStringSchema.optional(),
    endTime: isoDateStringSchema.optional(),
    estimatedCost: z.coerce
      .number()
      .min(0, 'Estimated cost cannot be negative')
      .optional(),
    currency: currencyCodeSchema.optional(),
  })
  .refine(
    (value) => {
      if (!value.startTime || !value.endTime) {
        return true
      }

      return new Date(value.endTime).getTime() >= new Date(value.startTime).getTime()
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    },
  )

const activityReorderSchema = z.object({
  orderedActivityIds: z
    .array(objectIdSchema)
    .min(1, 'At least one activity id is required')
    .refine((ids) => new Set(ids).size === ids.length, 'Activity ids must be unique'),
})

export {
  activityCardSchema,
  activityReorderSchema,
  itineraryDaySchema,
  tripCreateSchema,
}
