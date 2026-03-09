import { Expense, Trip, TripMember } from '../models/index.js'

const ensureUserEntry = (userMap, userId) => {
  const key = userId.toString()

  if (!userMap.has(key)) {
    userMap.set(key, {
      userId: key,
      paid: 0,
      owed: 0,
      net: 0,
    })
  }

  return userMap.get(key)
}

const buildCustomShares = (expense, participantIds, totalAmount) => {
  const splits = Array.isArray(expense.splitBetween) ? expense.splitBetween : []

  if (splits.length === 0) {
    return new Map([[expense.paidBy.toString(), totalAmount]])
  }

  const hasAmount = splits.some((split) => Number(split.amount || 0) > 0)

  if (hasAmount) {
    const shareMap = new Map()
    let totalAssigned = 0

    for (const split of splits) {
      const share = Number(split.amount || 0)
      if (share <= 0) {
        continue
      }

      const key = split.user.toString()
      shareMap.set(key, share)
      totalAssigned += share
    }

    const diff = Number((totalAmount - totalAssigned).toFixed(6))
    if (Math.abs(diff) > 0.000001) {
      const payerKey = expense.paidBy.toString()
      shareMap.set(payerKey, Number(((shareMap.get(payerKey) || 0) + diff).toFixed(6)))
    }

    return shareMap
  }

  const totalWeight = splits.reduce((acc, split) => acc + Number(split.weight || 0), 0)
  if (totalWeight <= 0) {
    return new Map([[expense.paidBy.toString(), totalAmount]])
  }

  const weightedShares = new Map()
  let allocated = 0

  for (const split of splits) {
    const weight = Number(split.weight || 0)
    if (weight <= 0) {
      continue
    }

    const amount = Number(((totalAmount * weight) / totalWeight).toFixed(6))
    weightedShares.set(split.user.toString(), amount)
    allocated += amount
  }

  const roundingDiff = Number((totalAmount - allocated).toFixed(6))
  if (Math.abs(roundingDiff) > 0.000001) {
    const payerKey = expense.paidBy.toString()
    weightedShares.set(
      payerKey,
      Number(((weightedShares.get(payerKey) || 0) + roundingDiff).toFixed(6)),
    )
  }

  return weightedShares
}

const getExpenseBaseAmount = (expense) => {
  if (typeof expense.normalizedAmount === 'number' && Number.isFinite(expense.normalizedAmount)) {
    return expense.normalizedAmount
  }

  return Number(expense.amount || 0)
}

const buildSettlementReport = async ({ tripId }) => {
  const [trip, members, expenses] = await Promise.all([
    Trip.findById(tripId).select('_id owner settings').lean(),
    TripMember.find({ trip: tripId, isActive: true }).select('user role').lean(),
    Expense.find({ trip: tripId }).lean(),
  ])

  if (!trip) {
    throw new Error('Trip not found')
  }

  const participantIds = new Set([trip.owner.toString()])
  for (const member of members) {
    participantIds.add(member.user.toString())
  }

  const participantList = Array.from(participantIds)
  const userLedger = new Map()

  for (const participantId of participantList) {
    ensureUserEntry(userLedger, participantId)
  }

  for (const expense of expenses) {
    const totalAmount = getExpenseBaseAmount(expense)
    const payerKey = expense.paidBy.toString()
    ensureUserEntry(userLedger, payerKey).paid += totalAmount

    if (expense.splitType === 'none') {
      ensureUserEntry(userLedger, payerKey).owed += totalAmount
      continue
    }

    if (expense.splitType === 'equal') {
      const eligibleParticipants = participantList
      const share = eligibleParticipants.length > 0 ? totalAmount / eligibleParticipants.length : 0

      for (const userId of eligibleParticipants) {
        ensureUserEntry(userLedger, userId).owed += share
      }

      continue
    }

    const customShares = buildCustomShares(expense, participantList, totalAmount)

    for (const [userId, share] of customShares.entries()) {
      ensureUserEntry(userLedger, userId).owed += share
    }
  }

  const balances = []

  for (const ledgerEntry of userLedger.values()) {
    const paid = Number(ledgerEntry.paid.toFixed(2))
    const owed = Number(ledgerEntry.owed.toFixed(2))
    const net = Number((paid - owed).toFixed(2))

    balances.push({
      userId: ledgerEntry.userId,
      paid,
      owed,
      net,
    })
  }

  const creditors = balances
    .filter((entry) => entry.net > 0.009)
    .map((entry) => ({ ...entry, remaining: entry.net }))
    .sort((a, b) => b.remaining - a.remaining)

  const debtors = balances
    .filter((entry) => entry.net < -0.009)
    .map((entry) => ({ ...entry, remaining: Math.abs(entry.net) }))
    .sort((a, b) => b.remaining - a.remaining)

  const settlements = []

  let creditorIndex = 0
  let debtorIndex = 0

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex]
    const debtor = debtors[debtorIndex]

    const amount = Number(Math.min(creditor.remaining, debtor.remaining).toFixed(2))

    if (amount > 0) {
      settlements.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount,
        currency: trip.settings?.currency || 'USD',
      })

      creditor.remaining = Number((creditor.remaining - amount).toFixed(2))
      debtor.remaining = Number((debtor.remaining - amount).toFixed(2))
    }

    if (creditor.remaining <= 0.009) {
      creditorIndex += 1
    }

    if (debtor.remaining <= 0.009) {
      debtorIndex += 1
    }
  }

  const totals = balances.reduce(
    (acc, balance) => {
      acc.totalPaid += balance.paid
      acc.totalOwed += balance.owed
      return acc
    },
    { totalPaid: 0, totalOwed: 0 },
  )

  totals.totalPaid = Number(totals.totalPaid.toFixed(2))
  totals.totalOwed = Number(totals.totalOwed.toFixed(2))

  return {
    tripId,
    currency: trip.settings?.currency || 'USD',
    participantCount: participantList.length,
    expenseCount: expenses.length,
    balances,
    settlements,
    totals,
  }
}

export { buildSettlementReport }
