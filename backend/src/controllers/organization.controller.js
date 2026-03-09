import {
  ATTACHMENT_TARGET_TYPES,
  Activity,
  Attachment,
  CHECKLIST_TYPES,
  Checklist,
  Comment,
  Expense,
  EXPENSE_CATEGORIES,
  ItineraryDay,
  Reservation,
  SPLIT_TYPES,
  TripBudget,
} from '../models/index.js'
import {
  buildExpenseAnalytics,
  buildExpenseSummary,
  buildSettlementReport,
  convertCurrencyAmount,
  createReportSnapshot,
  getReportSnapshotById,
  listExchangeRatesForTrip,
  listReportSnapshots,
  syncTripBudgetSummary,
  upsertExchangeRate,
} from '../services/index.js'
import {
  ApiError,
  ApiResponse,
  asyncHandler,
  assertObjectId,
  parseDateOrThrow,
  parsePagination,
} from '../utils/index.js'

const createChecklist = asyncHandler(async (req, res) => {
  const { tripId } = req.params
  const { title, type = 'todo' } = req.body

  if (!title || !title.trim()) {
    throw ApiError.badRequest('title is required')
  }

  if (!CHECKLIST_TYPES.includes(type)) {
    throw ApiError.badRequest(`type must be one of: ${CHECKLIST_TYPES.join(', ')}`)
  }

  const checklist = await Checklist.create({
    trip: tripId,
    title: title.trim(),
    type,
    createdBy: req.actorId,
  })

  return res
    .status(201)
    .json(new ApiResponse(201, { checklist }, 'Checklist created successfully'))
})

const listChecklists = asyncHandler(async (req, res) => {
  const { tripId } = req.params
  const checklists = await Checklist.find({ trip: tripId }).sort({ createdAt: -1 }).lean()

  return res
    .status(200)
    .json(new ApiResponse(200, { checklists }, 'Checklists fetched successfully'))
})

const addChecklistItem = asyncHandler(async (req, res) => {
  const { tripId, checklistId } = req.params
  const { label, assignee, dueDate } = req.body

  assertObjectId(checklistId, 'checklistId')

  if (!label || !label.trim()) {
    throw ApiError.badRequest('label is required')
  }

  if (assignee) {
    assertObjectId(assignee, 'assignee')
  }

  const checklist = await Checklist.findOne({ _id: checklistId, trip: tripId })
  if (!checklist) {
    throw ApiError.notFound('Checklist not found for this trip')
  }

  checklist.items.push({
    label: label.trim(),
    assignee: assignee || null,
    dueDate: dueDate ? parseDateOrThrow(dueDate, 'dueDate') : null,
    sortOrder: checklist.items.length,
  })

  await checklist.save()

  const item = checklist.items[checklist.items.length - 1]

  return res
    .status(201)
    .json(new ApiResponse(201, { item, checklist }, 'Checklist item added successfully'))
})

const updateChecklistItem = asyncHandler(async (req, res) => {
  const { tripId, checklistId, itemId } = req.params
  const { label, isCompleted, assignee, dueDate, sortOrder } = req.body

  assertObjectId(checklistId, 'checklistId')
  assertObjectId(itemId, 'itemId')

  const checklist = await Checklist.findOne({ _id: checklistId, trip: tripId })
  if (!checklist) {
    throw ApiError.notFound('Checklist not found for this trip')
  }

  const item = checklist.items.id(itemId)
  if (!item) {
    throw ApiError.notFound('Checklist item not found')
  }

  if (label !== undefined) {
    if (!label || !label.trim()) {
      throw ApiError.badRequest('label cannot be empty')
    }

    item.label = label.trim()
  }

  if (assignee !== undefined) {
    if (assignee !== null) {
      assertObjectId(assignee, 'assignee')
    }

    item.assignee = assignee
  }

  if (dueDate !== undefined) {
    item.dueDate = dueDate ? parseDateOrThrow(dueDate, 'dueDate') : null
  }

  if (sortOrder !== undefined) {
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      throw ApiError.badRequest('sortOrder must be a non-negative integer')
    }

    item.sortOrder = sortOrder
  }

  if (isCompleted !== undefined) {
    if (typeof isCompleted !== 'boolean') {
      throw ApiError.badRequest('isCompleted must be a boolean')
    }

    item.isCompleted = isCompleted

    if (isCompleted) {
      item.completedAt = new Date()
      item.completedBy = req.actorId
    } else {
      item.completedAt = null
      item.completedBy = null
    }
  }

  await checklist.save()

  return res
    .status(200)
    .json(new ApiResponse(200, { item, checklist }, 'Checklist item updated successfully'))
})

const resolveAttachmentTargetRef = async ({ tripId, targetType, body }) => {
  const refs = {
    day: null,
    activity: null,
    reservation: null,
    expense: null,
    comment: null,
  }

  if (targetType === 'day') {
    assertObjectId(body.dayId, 'dayId')
    const day = await ItineraryDay.findOne({ _id: body.dayId, trip: tripId }).select('_id')
    if (!day) {
      throw ApiError.notFound('Day not found for this trip')
    }
    refs.day = body.dayId
  }

  if (targetType === 'activity') {
    assertObjectId(body.activityId, 'activityId')
    const activity = await Activity.findOne({ _id: body.activityId, trip: tripId }).select('_id')
    if (!activity) {
      throw ApiError.notFound('Activity not found for this trip')
    }
    refs.activity = body.activityId
  }

  if (targetType === 'reservation') {
    assertObjectId(body.reservationId, 'reservationId')
    const reservation = await Reservation.findOne({
      _id: body.reservationId,
      trip: tripId,
    }).select('_id')
    if (!reservation) {
      throw ApiError.notFound('Reservation not found for this trip')
    }
    refs.reservation = body.reservationId
  }

  if (targetType === 'expense') {
    assertObjectId(body.expenseId, 'expenseId')
    const expense = await Expense.findOne({ _id: body.expenseId, trip: tripId }).select('_id')
    if (!expense) {
      throw ApiError.notFound('Expense not found for this trip')
    }
    refs.expense = body.expenseId
  }

  if (targetType === 'comment') {
    assertObjectId(body.commentId, 'commentId')
    const comment = await Comment.findOne({ _id: body.commentId, trip: tripId }).select('_id')
    if (!comment) {
      throw ApiError.notFound('Comment not found for this trip')
    }
    refs.comment = body.commentId
  }

  return refs
}

const createAttachment = asyncHandler(async (req, res) => {
  const { tripId } = req.params
  const {
    fileName,
    mimeType,
    sizeBytes,
    targetType = 'trip',
    storageProvider = 'local',
    storageKey,
    url,
    metadata,
  } = req.body

  if (!fileName || !fileName.trim()) {
    throw ApiError.badRequest('fileName is required')
  }

  if (!mimeType || !mimeType.trim()) {
    throw ApiError.badRequest('mimeType is required')
  }

  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) {
    throw ApiError.badRequest('sizeBytes must be a positive integer')
  }

  if (!ATTACHMENT_TARGET_TYPES.includes(targetType)) {
    throw ApiError.badRequest(`targetType must be one of: ${ATTACHMENT_TARGET_TYPES.join(', ')}`)
  }

  const refs = await resolveAttachmentTargetRef({
    tripId,
    targetType,
    body: req.body,
  })

  const generatedStorageKey = `${tripId}/${Date.now()}-${fileName.trim().replace(/\s+/g, '-')}`

  const attachment = await Attachment.create({
    trip: tripId,
    uploadedBy: req.actorId,
    targetType,
    ...refs,
    fileName: fileName.trim(),
    mimeType: mimeType.trim(),
    sizeBytes,
    storageProvider,
    storageKey: storageKey || generatedStorageKey,
    url: url || '',
    metadata: metadata || {},
  })

  return res
    .status(201)
    .json(new ApiResponse(201, { attachment }, 'Attachment created successfully'))
})

const listAttachments = asyncHandler(async (req, res) => {
  const { tripId } = req.params
  const { targetType } = req.query

  const filters = { trip: tripId }

  if (targetType) {
    if (!ATTACHMENT_TARGET_TYPES.includes(targetType)) {
      throw ApiError.badRequest(`targetType must be one of: ${ATTACHMENT_TARGET_TYPES.join(', ')}`)
    }

    filters.targetType = targetType
  }

  const attachments = await Attachment.find(filters).sort({ createdAt: -1 }).lean()

  return res
    .status(200)
    .json(new ApiResponse(200, { attachments }, 'Attachments fetched successfully'))
})

const uploadAttachmentFile = asyncHandler(async (req, res) => {
  const { tripId } = req.params

  if (!req.file) {
    throw ApiError.badRequest('file is required')
  }

  const { targetType = 'trip', metadata } = req.body

  if (!ATTACHMENT_TARGET_TYPES.includes(targetType)) {
    throw ApiError.badRequest(`targetType must be one of: ${ATTACHMENT_TARGET_TYPES.join(', ')}`)
  }

  const refs = await resolveAttachmentTargetRef({
    tripId,
    targetType,
    body: req.body,
  })

  const attachment = await Attachment.create({
    trip: tripId,
    uploadedBy: req.actorId,
    targetType,
    ...refs,
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    storageProvider: 'local',
    storageKey: req.file.filename,
    url: `/uploads/${req.file.filename}`,
    metadata: metadata || {},
  })

  return res
    .status(201)
    .json(new ApiResponse(201, { attachment }, 'Attachment uploaded successfully'))
})

const createReservation = asyncHandler(async (req, res) => {
  const { tripId } = req.params
  const {
    title,
    reservationType,
    status,
    providerName,
    confirmationCode,
    startDateTime,
    endDateTime,
    location,
    amount,
    currency,
    notes,
    attachmentIds = [],
  } = req.body

  if (!title || !title.trim()) {
    throw ApiError.badRequest('title is required')
  }

  if (!startDateTime) {
    throw ApiError.badRequest('startDateTime is required')
  }

  const parsedStartDateTime = parseDateOrThrow(startDateTime, 'startDateTime')
  const parsedEndDateTime = endDateTime ? parseDateOrThrow(endDateTime, 'endDateTime') : null

  if (parsedEndDateTime && parsedEndDateTime < parsedStartDateTime) {
    throw ApiError.badRequest('endDateTime must be greater than or equal to startDateTime')
  }

  for (const attachmentId of attachmentIds) {
    assertObjectId(attachmentId, 'attachmentId')
  }

  const reservation = await Reservation.create({
    trip: tripId,
    createdBy: req.actorId,
    title: title.trim(),
    reservationType: reservationType || 'other',
    status: status || 'planned',
    providerName: providerName || '',
    confirmationCode: confirmationCode || '',
    startDateTime: parsedStartDateTime,
    endDateTime: parsedEndDateTime,
    location: {
      name: location?.name || '',
      address: location?.address || '',
    },
    amount: Number(amount || 0),
    currency: currency || req.trip.settings.currency || 'USD',
    notes: notes || '',
    attachmentIds,
  })

  return res
    .status(201)
    .json(new ApiResponse(201, { reservation }, 'Reservation created successfully'))
})

const listReservations = asyncHandler(async (req, res) => {
  const { tripId } = req.params
  const reservations = await Reservation.find({ trip: tripId })
    .sort({ startDateTime: 1, createdAt: -1 })
    .lean()

  return res
    .status(200)
    .json(new ApiResponse(200, { reservations }, 'Reservations fetched successfully'))
})

const createExpense = asyncHandler(async (req, res) => {
  const { tripId } = req.params
  const {
    day,
    activity,
    reservation,
    title,
    category = 'other',
    amount,
    currency,
    expenseDate,
    paidBy,
    splitType = 'none',
    splitBetween = [],
    notes,
    receiptAttachment,
  } = req.body

  if (!title || !title.trim()) {
    throw ApiError.badRequest('title is required')
  }

  if (amount === undefined || Number(amount) < 0) {
    throw ApiError.badRequest('amount must be provided and cannot be negative')
  }

  if (!EXPENSE_CATEGORIES.includes(category)) {
    throw ApiError.badRequest(`category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`)
  }

  if (!SPLIT_TYPES.includes(splitType)) {
    throw ApiError.badRequest(`splitType must be one of: ${SPLIT_TYPES.join(', ')}`)
  }

  if (splitType === 'custom') {
    if (!Array.isArray(splitBetween) || splitBetween.length === 0) {
      throw ApiError.badRequest('splitBetween is required when splitType is custom')
    }

    for (const split of splitBetween) {
      assertObjectId(split.user, 'split user')
      if (split.amount !== undefined && Number(split.amount) < 0) {
        throw ApiError.badRequest('split amount cannot be negative')
      }
      if (split.weight !== undefined && Number(split.weight) < 0) {
        throw ApiError.badRequest('split weight cannot be negative')
      }
    }
  }

  if (day) {
    assertObjectId(day, 'day')
  }

  if (activity) {
    assertObjectId(activity, 'activity')
  }

  if (reservation) {
    assertObjectId(reservation, 'reservation')
  }

  if (receiptAttachment) {
    assertObjectId(receiptAttachment, 'receiptAttachment')
  }

  const paidByUser = paidBy || req.actorId
  assertObjectId(paidByUser, 'paidBy')

  const tripCurrency = req.trip.settings.currency || 'USD'
  const expenseCurrency = (currency || tripCurrency).toUpperCase()

  const conversion = await convertCurrencyAmount({
    tripId,
    amount: Number(amount),
    fromCurrency: expenseCurrency,
    toCurrency: tripCurrency,
  })

  const expense = await Expense.create({
    trip: tripId,
    day: day || null,
    activity: activity || null,
    reservation: reservation || null,
    createdBy: req.actorId,
    paidBy: paidByUser,
    title: title.trim(),
    category,
    amount: Number(amount),
    normalizedAmount: conversion.convertedAmount,
    currency: expenseCurrency,
    normalizedCurrency: tripCurrency,
    exchangeRateApplied: conversion.rate,
    expenseDate: expenseDate ? parseDateOrThrow(expenseDate, 'expenseDate') : new Date(),
    splitType,
    splitBetween,
    notes: notes || '',
    receiptAttachment: receiptAttachment || null,
  })

  const { summary, tripBudget } = await syncTripBudgetSummary(tripId)

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        expense,
        conversion,
        budgetSummary: summary,
        tripBudget,
      },
      'Expense created successfully',
    ),
  )
})

const listExpenses = asyncHandler(async (req, res) => {
  const { tripId } = req.params
  const { page, limit, skip } = parsePagination(req.query)

  const filters = { trip: tripId }

  if (req.query.category) {
    if (!EXPENSE_CATEGORIES.includes(req.query.category)) {
      throw ApiError.badRequest(
        `category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`,
      )
    }

    filters.category = req.query.category
  }

  const [expenses, total] = await Promise.all([
    Expense.find(filters).sort({ expenseDate: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Expense.countDocuments(filters),
  ])

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        expenses,
      },
      'Expenses fetched successfully',
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    ),
  )
})

const upsertTripBudget = asyncHandler(async (req, res) => {
  const { tripId } = req.params
  const { currency, totalBudget, categoryLimits, alertThresholds } = req.body

  let budget = await TripBudget.findOne({ trip: tripId })

  if (!budget) {
    budget = new TripBudget({ trip: tripId })
  }

  if (currency !== undefined) {
    budget.currency = currency
  }

  if (totalBudget !== undefined) {
    const parsedBudget = Number(totalBudget)
    if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
      throw ApiError.badRequest('totalBudget must be a non-negative number')
    }

    budget.totalBudget = parsedBudget
  }

  if (categoryLimits !== undefined) {
    if (!Array.isArray(categoryLimits)) {
      throw ApiError.badRequest('categoryLimits must be an array')
    }

    for (const categoryLimit of categoryLimits) {
      if (!EXPENSE_CATEGORIES.includes(categoryLimit.category)) {
        throw ApiError.badRequest(
          `category limit category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`,
        )
      }

      if (Number(categoryLimit.limit) < 0) {
        throw ApiError.badRequest('category limit value must be non-negative')
      }
    }

    budget.categoryLimits = categoryLimits
  }

  if (alertThresholds !== undefined) {
    budget.alertThresholds = {
      warningPercent:
        alertThresholds.warningPercent ?? budget.alertThresholds.warningPercent,
      criticalPercent:
        alertThresholds.criticalPercent ?? budget.alertThresholds.criticalPercent,
    }
  }

  await budget.save()

  const { summary, tripBudget } = await syncTripBudgetSummary(tripId)

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        budget: tripBudget,
        summary,
      },
      'Trip budget saved successfully',
    ),
  )
})

const getBudgetSummary = asyncHandler(async (req, res) => {
  const { tripId } = req.params

  const { summary, tripBudget } = await syncTripBudgetSummary(tripId)

  const totalBudget = tripBudget.totalBudget || 0
  const utilizationPercent = totalBudget > 0 ? (summary.spentTotal / totalBudget) * 100 : 0

  const response = {
    budget: tripBudget,
    summary,
    utilizationPercent: Number(utilizationPercent.toFixed(2)),
  }

  return res
    .status(200)
    .json(new ApiResponse(200, response, 'Budget summary fetched successfully'))
})

const listOrganizationOverview = asyncHandler(async (req, res) => {
  const { tripId } = req.params

  const [checklists, attachments, reservations, summary] = await Promise.all([
    Checklist.countDocuments({ trip: tripId }),
    Attachment.countDocuments({ trip: tripId }),
    Reservation.countDocuments({ trip: tripId }),
    buildExpenseSummary(tripId),
  ])

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        checklists,
        attachments,
        reservations,
        expenses: summary,
      },
      'Organization overview fetched successfully',
    ),
  )
})

const upsertTripExchangeRate = asyncHandler(async (req, res) => {
  const { tripId } = req.params
  const { baseCurrency, quoteCurrency, rate, source } = req.body

  const exchangeRate = await upsertExchangeRate({
    tripId,
    baseCurrency,
    quoteCurrency,
    rate,
    source,
    actorId: req.actorId,
  })

  return res
    .status(200)
    .json(new ApiResponse(200, { exchangeRate }, 'Exchange rate upserted successfully'))
})

const listTripExchangeRates = asyncHandler(async (req, res) => {
  const { tripId } = req.params

  const exchangeRates = await listExchangeRatesForTrip(tripId)

  return res
    .status(200)
    .json(new ApiResponse(200, { exchangeRates }, 'Exchange rates fetched successfully'))
})

const convertCurrencyPreview = asyncHandler(async (req, res) => {
  const { tripId } = req.params
  const { amount, fromCurrency, toCurrency } = req.body

  const conversion = await convertCurrencyAmount({
    tripId,
    amount,
    fromCurrency,
    toCurrency,
  })

  return res
    .status(200)
    .json(new ApiResponse(200, { conversion }, 'Currency conversion preview generated'))
})

const getExpenseAnalytics = asyncHandler(async (req, res) => {
  const { tripId } = req.params
  const granularity = req.query.granularity || 'month'
  const periodDays = Number(req.query.periodDays || 180)
  const forecastPeriods = Number(req.query.forecastPeriods || 3)

  const analytics = await buildExpenseAnalytics({
    tripId,
    granularity,
    periodDays,
    forecastPeriods,
  })

  return res
    .status(200)
    .json(new ApiResponse(200, { analytics }, 'Expense analytics generated successfully'))
})

const getSettlementReport = asyncHandler(async (req, res) => {
  const { tripId } = req.params

  const settlement = await buildSettlementReport({ tripId })

  return res
    .status(200)
    .json(new ApiResponse(200, { settlement }, 'Settlement report generated successfully'))
})

const buildSnapshotData = async ({ tripId, reportType, filters }) => {
  if (reportType === 'analytics') {
    return buildExpenseAnalytics({
      tripId,
      granularity: filters?.granularity || 'month',
      periodDays: Number(filters?.periodDays || 180),
      forecastPeriods: Number(filters?.forecastPeriods || 3),
    })
  }

  if (reportType === 'settlement') {
    return buildSettlementReport({ tripId })
  }

  if (reportType === 'budget') {
    const { summary, tripBudget } = await syncTripBudgetSummary(tripId)
    const totalBudget = tripBudget.totalBudget || 0
    const utilizationPercent = totalBudget > 0 ? (summary.spentTotal / totalBudget) * 100 : 0

    return {
      budget: tripBudget,
      summary,
      utilizationPercent: Number(utilizationPercent.toFixed(2)),
    }
  }

  const { page, limit, skip } = parsePagination(filters || {})
  const [expenses, total] = await Promise.all([
    Expense.find({ trip: tripId })
      .sort({ expenseDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Expense.countDocuments({ trip: tripId }),
  ])

  return {
    expenses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  }
}

const createTripReportSnapshot = asyncHandler(async (req, res) => {
  const { tripId } = req.params
  const { reportType = 'analytics', format = 'json', filters = {} } = req.body

  const allowedTypes = ['analytics', 'settlement', 'budget', 'expenses']
  const allowedFormats = ['json', 'csv']

  if (!allowedTypes.includes(reportType)) {
    throw ApiError.badRequest(`reportType must be one of: ${allowedTypes.join(', ')}`)
  }

  if (!allowedFormats.includes(format)) {
    throw ApiError.badRequest(`format must be one of: ${allowedFormats.join(', ')}`)
  }

  const data = await buildSnapshotData({ tripId, reportType, filters })

  const snapshot = await createReportSnapshot({
    tripId,
    actorId: req.actorId,
    reportType,
    format,
    filters,
    data,
  })

  return res
    .status(201)
    .json(new ApiResponse(201, { snapshot }, 'Report snapshot created successfully'))
})

const listTripReportSnapshots = asyncHandler(async (req, res) => {
  const { tripId } = req.params
  const reportType = req.query.reportType || null

  const snapshots = await listReportSnapshots({ tripId, reportType })

  return res
    .status(200)
    .json(new ApiResponse(200, { snapshots }, 'Report snapshots fetched successfully'))
})

const getTripReportSnapshotById = asyncHandler(async (req, res) => {
  const { tripId, snapshotId } = req.params
  const shouldDownload = String(req.query.download || 'false').toLowerCase() === 'true'

  assertObjectId(snapshotId, 'snapshotId')

  const snapshot = await getReportSnapshotById({ tripId, snapshotId })

  if (!snapshot) {
    throw ApiError.notFound('Report snapshot not found')
  }

  if (shouldDownload) {
    const fileBaseName = `${snapshot.reportType}-${snapshot._id}`

    if (snapshot.format === 'csv') {
      const csvText =
        snapshot.payload?.csv ||
        snapshot.payload?.balancesCsv ||
        snapshot.payload?.settlementsCsv ||
        ''

      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${fileBaseName}.csv"`)
      res.status(200).send(csvText)
      return
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${fileBaseName}.json"`)
    res.status(200).send(JSON.stringify(snapshot.payload, null, 2))
    return
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { snapshot }, 'Report snapshot fetched successfully'))
})

export {
  addChecklistItem,
  convertCurrencyPreview,
  createAttachment,
  createChecklist,
  createExpense,
  createReservation,
  createTripReportSnapshot,
  getBudgetSummary,
  getExpenseAnalytics,
  getSettlementReport,
  getTripReportSnapshotById,
  listAttachments,
  listChecklists,
  listExpenses,
  listOrganizationOverview,
  listReservations,
  listTripExchangeRates,
  listTripReportSnapshots,
  uploadAttachmentFile,
  updateChecklistItem,
  upsertTripBudget,
  upsertTripExchangeRate,
}
