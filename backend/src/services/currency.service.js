import { ExchangeRate } from '../models/index.js'
import { ApiError } from '../utils/index.js'

const normalizeCurrency = (value) => (value || '').trim().toUpperCase()

const upsertExchangeRate = async ({
  tripId,
  baseCurrency,
  quoteCurrency,
  rate,
  source = 'manual',
  actorId,
}) => {
  const normalizedBaseCurrency = normalizeCurrency(baseCurrency)
  const normalizedQuoteCurrency = normalizeCurrency(quoteCurrency)

  if (!normalizedBaseCurrency || !normalizedQuoteCurrency) {
    throw ApiError.badRequest('baseCurrency and quoteCurrency are required')
  }

  if (normalizedBaseCurrency === normalizedQuoteCurrency) {
    throw ApiError.badRequest('baseCurrency and quoteCurrency cannot be same')
  }

  const numericRate = Number(rate)
  if (!Number.isFinite(numericRate) || numericRate <= 0) {
    throw ApiError.badRequest('rate must be a positive number')
  }

  const exchangeRate = await ExchangeRate.findOneAndUpdate(
    {
      trip: tripId,
      baseCurrency: normalizedBaseCurrency,
      quoteCurrency: normalizedQuoteCurrency,
    },
    {
      $set: {
        rate: numericRate,
        source,
        createdBy: actorId,
        asOf: new Date(),
      },
    },
    {
      upsert: true,
      setDefaultsOnInsert: true,
      returnDocument: 'after',
    },
  )

  return exchangeRate
}

const getExchangeRate = async ({ tripId, fromCurrency, toCurrency }) => {
  const normalizedFrom = normalizeCurrency(fromCurrency)
  const normalizedTo = normalizeCurrency(toCurrency)

  if (!normalizedFrom || !normalizedTo) {
    throw ApiError.badRequest('fromCurrency and toCurrency are required')
  }

  if (normalizedFrom === normalizedTo) {
    return {
      rate: 1,
      inverseApplied: false,
      baseCurrency: normalizedFrom,
      quoteCurrency: normalizedTo,
      source: 'identity',
    }
  }

  const directRate = await ExchangeRate.findOne({
    trip: tripId,
    baseCurrency: normalizedFrom,
    quoteCurrency: normalizedTo,
  }).lean()

  if (directRate) {
    return {
      rate: directRate.rate,
      inverseApplied: false,
      baseCurrency: directRate.baseCurrency,
      quoteCurrency: directRate.quoteCurrency,
      source: directRate.source,
    }
  }

  const reverseRate = await ExchangeRate.findOne({
    trip: tripId,
    baseCurrency: normalizedTo,
    quoteCurrency: normalizedFrom,
  }).lean()

  if (reverseRate) {
    return {
      rate: 1 / reverseRate.rate,
      inverseApplied: true,
      baseCurrency: reverseRate.baseCurrency,
      quoteCurrency: reverseRate.quoteCurrency,
      source: reverseRate.source,
    }
  }

  throw ApiError.badRequest(
    `Missing exchange rate for ${normalizedFrom} -> ${normalizedTo}. Add rate using currency rates API first.`,
  )
}

const convertCurrencyAmount = async ({ tripId, amount, fromCurrency, toCurrency }) => {
  const numericAmount = Number(amount)
  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    throw ApiError.badRequest('amount must be a non-negative number')
  }

  const exchangeRate = await getExchangeRate({ tripId, fromCurrency, toCurrency })
  const convertedAmount = Number((numericAmount * exchangeRate.rate).toFixed(6))

  return {
    amount: numericAmount,
    fromCurrency: normalizeCurrency(fromCurrency),
    toCurrency: normalizeCurrency(toCurrency),
    rate: exchangeRate.rate,
    convertedAmount,
    source: exchangeRate.source,
    inverseApplied: exchangeRate.inverseApplied,
  }
}

const listExchangeRatesForTrip = async (tripId) => {
  return ExchangeRate.find({ trip: tripId })
    .sort({ baseCurrency: 1, quoteCurrency: 1 })
    .lean()
}

export {
  convertCurrencyAmount,
  getExchangeRate,
  listExchangeRatesForTrip,
  upsertExchangeRate,
}
