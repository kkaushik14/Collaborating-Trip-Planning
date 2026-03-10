import { z } from 'zod'

import { currencyCodeSchema, isoDateStringSchema } from './schema-utils.js'

const exchangeRateSchema = z.object({
  baseCurrency: currencyCodeSchema,
  quoteCurrency: currencyCodeSchema,
  rate: z.coerce.number().positive('Exchange rate must be greater than zero'),
  source: z
    .string()
    .trim()
    .min(2, 'Source is required')
    .max(40, 'Source cannot exceed 40 characters')
    .default('manual'),
  asOf: isoDateStringSchema,
})

const currencyConversionSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  fromCurrency: currencyCodeSchema,
  toCurrency: currencyCodeSchema,
})

const settlementRequestSchema = z.object({
  currency: currencyCodeSchema.optional(),
})

const reportSnapshotSchema = z.object({
  reportType: z
    .string()
    .trim()
    .min(2, 'Report type is required')
    .max(80, 'Report type cannot exceed 80 characters'),
  format: z.enum(['json', 'csv']).default('json'),
  filters: z.record(z.any()).optional(),
})

export {
  currencyConversionSchema,
  exchangeRateSchema,
  reportSnapshotSchema,
  settlementRequestSchema,
}
