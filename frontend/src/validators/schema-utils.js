import { z } from 'zod'

const objectIdRegex = /^[a-f\d]{24}$/i
const isoDateRegex =
  /^\d{4}-\d{2}-\d{2}(?:[tT ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:[zZ]|[+-]\d{2}:\d{2})?)?$/
const currencyRegex = /^[A-Z]{3}$/

const objectIdSchema = z
  .string()
  .trim()
  .regex(objectIdRegex, 'Must be a valid MongoDB ObjectId')

const isoDateStringSchema = z
  .string()
  .trim()
  .regex(isoDateRegex, 'Must be a valid ISO date string')

const currencyCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(currencyRegex, 'Must be a valid 3-letter currency code')

const roleSchema = z.enum(['OWNER', 'EDITOR', 'VIEWER'])

const emailSchema = z
  .string()
  .trim()
  .email('Enter a valid email address')

export {
  currencyCodeSchema,
  emailSchema,
  isoDateStringSchema,
  objectIdSchema,
  roleSchema,
}
