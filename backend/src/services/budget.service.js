import { Expense, TripBudget } from '../models/index.js'
import { toObjectId } from '../utils/index.js'

const buildExpenseSummary = async (tripId) => {
  const tripObjectId = toObjectId(tripId, 'tripId')

  const rows = await Expense.aggregate([
    { $match: { trip: tripObjectId } },
    {
      $addFields: {
        effectiveAmount: {
          $cond: [
            { $gt: ['$normalizedAmount', 0] },
            '$normalizedAmount',
            '$amount',
          ],
        },
      },
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$effectiveAmount' },
        count: { $sum: 1 },
      },
    },
  ])

  const spentByCategory = {}
  let spentTotal = 0
  let expenseCount = 0

  for (const row of rows) {
    spentByCategory[row._id] = row.total
    spentTotal += row.total
    expenseCount += row.count
  }

  return {
    expenseCount,
    spentByCategory,
    spentTotal,
  }
}

const syncTripBudgetSummary = async (tripId) => {
  const summary = await buildExpenseSummary(tripId)

  let tripBudget = await TripBudget.findOne({ trip: tripId })

  if (!tripBudget) {
    tripBudget = await TripBudget.create({
      trip: tripId,
      summary: {
        spentTotal: summary.spentTotal,
        spentByCategory: summary.spentByCategory,
        lastCalculatedAt: new Date(),
      },
    })

    return { summary, tripBudget }
  }

  tripBudget.summary.spentTotal = summary.spentTotal
  tripBudget.summary.spentByCategory = summary.spentByCategory
  tripBudget.summary.lastCalculatedAt = new Date()
  await tripBudget.save()

  return { summary, tripBudget }
}

export { buildExpenseSummary, syncTripBudgetSummary }
