import { Expense } from '../models/index.js'
import { toObjectId } from '../utils/index.js'

const dateKeyFormatters = {
  day: (date) => date.toISOString().slice(0, 10),
  week: (date) => {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    const day = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - day)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
  },
  month: (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`,
}

const getExpenseBaseAmount = (expense) => {
  if (typeof expense.normalizedAmount === 'number' && Number.isFinite(expense.normalizedAmount)) {
    return expense.normalizedAmount
  }

  return Number(expense.amount || 0)
}

const buildLinearRegressionForecast = (trendPoints, forecastPeriods) => {
  if (trendPoints.length === 0) {
    return []
  }

  const n = trendPoints.length
  const xValues = trendPoints.map((_point, index) => index + 1)
  const yValues = trendPoints.map((point) => Number(point.total || 0))

  const sumX = xValues.reduce((acc, value) => acc + value, 0)
  const sumY = yValues.reduce((acc, value) => acc + value, 0)
  const sumXY = xValues.reduce((acc, value, index) => acc + value * yValues[index], 0)
  const sumXX = xValues.reduce((acc, value) => acc + value * value, 0)

  const denominator = n * sumXX - sumX * sumX

  let slope = 0
  let intercept = yValues[n - 1] || 0

  if (denominator !== 0) {
    slope = (n * sumXY - sumX * sumY) / denominator
    intercept = (sumY - slope * sumX) / n
  }

  const forecast = []

  for (let i = 1; i <= forecastPeriods; i += 1) {
    const x = n + i
    const projectedValue = Math.max(0, Number((intercept + slope * x).toFixed(2)))

    forecast.push({
      periodIndex: x,
      projectedTotal: projectedValue,
      method: 'linear-regression',
    })
  }

  return forecast
}

const buildExpenseAnalytics = async ({
  tripId,
  granularity = 'month',
  periodDays = 180,
  forecastPeriods = 3,
}) => {
  const keyFormatter = dateKeyFormatters[granularity] || dateKeyFormatters.month
  const fromDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)

  const expenses = await Expense.find({
    trip: toObjectId(tripId, 'tripId'),
    expenseDate: { $gte: fromDate },
  })
    .sort({ expenseDate: 1 })
    .lean()

  const trendMap = new Map()
  const categoryMap = new Map()

  for (const expense of expenses) {
    const expenseDate = new Date(expense.expenseDate)
    const key = keyFormatter(expenseDate)
    const amount = getExpenseBaseAmount(expense)

    trendMap.set(key, Number(((trendMap.get(key) || 0) + amount).toFixed(2)))

    const category = expense.category || 'other'
    categoryMap.set(category, Number(((categoryMap.get(category) || 0) + amount).toFixed(2)))
  }

  const trendPoints = Array.from(trendMap.entries()).map(([period, total], index) => ({
    period,
    total,
    periodIndex: index + 1,
  }))

  const totalSpent = trendPoints.reduce((acc, point) => acc + point.total, 0)
  const averagePerPeriod = trendPoints.length > 0 ? totalSpent / trendPoints.length : 0

  const forecast = buildLinearRegressionForecast(trendPoints, forecastPeriods)

  return {
    granularity,
    periodDays,
    fromDate,
    toDate: new Date(),
    totals: {
      totalSpent: Number(totalSpent.toFixed(2)),
      averagePerPeriod: Number(averagePerPeriod.toFixed(2)),
      periodCount: trendPoints.length,
      expenseCount: expenses.length,
    },
    trend: trendPoints,
    byCategory: Array.from(categoryMap.entries()).map(([category, total]) => ({ category, total })),
    forecast,
  }
}

export { buildExpenseAnalytics }
