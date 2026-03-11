import Joi from 'joi'

const objectIdSchema = Joi.string().length(24).hex()
const isoDateSchema = Joi.date().iso()

const authSchemas = {
  register: Joi.object({
    name: Joi.string().trim().min(2).max(120).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
  }),
  refresh: Joi.object({
    refreshToken: Joi.string().required(),
  }),
  updateProfile: Joi.object({
    name: Joi.string().trim().min(2).max(120),
    email: Joi.string().email(),
    mobileNumber: Joi.string().trim().pattern(/^[0-9+\-()\s]{7,20}$/).allow('', null),
    avatarUrl: Joi.string().trim().uri().allow('', null),
    themePreference: Joi.string().valid('light', 'dark'),
  }).min(1),
}

const tripSchemas = {
  create: Joi.object({
    title: Joi.string().trim().min(3).max(140).required(),
    description: Joi.string().allow('').max(2000),
    startDate: isoDateSchema.required(),
    endDate: isoDateSchema.required(),
    travelerCount: Joi.number().integer().min(1),
    travelers: Joi.alternatives().try(Joi.number().integer().min(1), Joi.array()),
    settings: Joi.object({
      currency: Joi.string().trim().length(3),
      timezone: Joi.string().trim().max(100),
    }),
  }),
  update: Joi.object({
    title: Joi.string().trim().min(3).max(140),
    description: Joi.string().allow('').max(2000),
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    travelerCount: Joi.number().integer().min(1),
    travelers: Joi.alternatives().try(Joi.number().integer().min(1), Joi.array()),
    status: Joi.string().valid('draft', 'active', 'archived'),
    visibility: Joi.string().valid('private', 'shared'),
    settings: Joi.object({
      currency: Joi.string().trim().length(3),
      timezone: Joi.string().trim().max(100),
    }),
  }).min(1),
  tripIdParam: Joi.object({
    tripId: objectIdSchema.required(),
  }),
  tripAndDayParam: Joi.object({
    tripId: objectIdSchema.required(),
    dayId: objectIdSchema.required(),
  }),
  tripAndMemberParam: Joi.object({
    tripId: objectIdSchema.required(),
    memberId: objectIdSchema.required(),
  }),
  tripAndChecklistParam: Joi.object({
    tripId: objectIdSchema.required(),
    checklistId: objectIdSchema.required(),
  }),
  tripChecklistItemParam: Joi.object({
    tripId: objectIdSchema.required(),
    checklistId: objectIdSchema.required(),
    itemId: objectIdSchema.required(),
  }),
  tripAndSnapshotParam: Joi.object({
    tripId: objectIdSchema.required(),
    snapshotId: objectIdSchema.required(),
  }),
  dayCreate: Joi.object({
    dayNumber: Joi.number().integer().min(1).required(),
    date: isoDateSchema.required(),
    title: Joi.string().allow('').max(140),
    notes: Joi.string().allow('').max(4000),
  }),
  activityCreate: Joi.object({
    title: Joi.string().trim().min(1).max(180).required(),
    description: Joi.string().allow('').max(4000),
    locationName: Joi.string().allow('').max(180),
    address: Joi.string().allow('').max(500),
    startTime: isoDateSchema.allow(null),
    endTime: isoDateSchema.allow(null),
    estimatedCost: Joi.object({
      amount: Joi.number().min(0),
      currency: Joi.string().trim().length(3),
    }),
  }),
  activityReorder: Joi.object({
    activityIds: Joi.array().items(objectIdSchema).min(1).required(),
  }),
}

const collaborationSchemas = {
  inviteMember: Joi.object({
    email: Joi.string().email().required(),
    role: Joi.string().valid('EDITOR', 'VIEWER').default('VIEWER'),
    expiresInDays: Joi.number().integer().min(1).max(90),
  }),
  updateMemberRole: Joi.object({
    role: Joi.string().valid('EDITOR', 'VIEWER', 'OWNER').required(),
  }),
  updateCommentEmailPreference: Joi.object({
    commentEmailOptIn: Joi.alternatives()
      .try(
        Joi.string().trim().lowercase().valid('true', 'false'),
        Joi.boolean(),
      )
      .required(),
  }),
  createComment: Joi.object({
    targetType: Joi.string().valid('day', 'activity').required(),
    dayId: objectIdSchema,
    day: objectIdSchema,
    activityId: objectIdSchema,
    activity: objectIdSchema,
    body: Joi.string().trim().min(1).max(2000).required(),
    parentComment: objectIdSchema.allow(null),
    parentCommentId: objectIdSchema.allow(null),
    mentions: Joi.array().items(objectIdSchema),
  })
    .custom((value, helpers) => {
      const resolvedDayId = value.dayId || value.day
      const resolvedActivityId = value.activityId || value.activity

      if (value.targetType === 'day' && !resolvedDayId) {
        return helpers.error('any.custom', {
          message: 'dayId is required when targetType is day',
        })
      }

      if (value.targetType === 'activity' && !resolvedActivityId) {
        return helpers.error('any.custom', {
          message: 'activityId is required when targetType is activity',
        })
      }

      return value
    })
    .messages({
      'any.custom': '{{#message}}',
    }),
  acceptInvitation: Joi.object({
    token: Joi.string().required(),
  }),
  transferOwnership: Joi.object({
    newOwnerUserId: objectIdSchema.required(),
  }),
}

const organizationSchemas = {
  createChecklist: Joi.object({
    title: Joi.string().trim().min(1).max(160).required(),
    type: Joi.string().valid('packing', 'todo', 'documents', 'custom').default('todo'),
  }),
  addChecklistItem: Joi.object({
    label: Joi.string().trim().min(1).max(250).required(),
    assignee: objectIdSchema.allow(null),
    dueDate: isoDateSchema.allow(null),
  }),
  updateChecklistItem: Joi.object({
    label: Joi.string().trim().min(1).max(250),
    isCompleted: Joi.boolean(),
    assignee: objectIdSchema.allow(null),
    dueDate: isoDateSchema.allow(null),
    sortOrder: Joi.number().integer().min(0),
  }).min(1),
  createAttachmentMeta: Joi.object({
    fileName: Joi.string().trim().min(1).max(255).required(),
    mimeType: Joi.string().trim().min(1).max(120).required(),
    sizeBytes: Joi.number().integer().min(1).required(),
    targetType: Joi.string().valid('trip', 'day', 'activity', 'reservation', 'expense', 'comment'),
    storageProvider: Joi.string().valid('local', 's3', 'gcs', 'azure', 'other'),
    storageKey: Joi.string().trim(),
    url: Joi.string().allow(''),
    metadata: Joi.object(),
    dayId: objectIdSchema,
    activityId: objectIdSchema,
    reservationId: objectIdSchema,
    expenseId: objectIdSchema,
    commentId: objectIdSchema,
  }),
  createReservation: Joi.object({
    title: Joi.string().trim().min(1).max(180).required(),
    reservationType: Joi.string().valid(
      'flight',
      'hotel',
      'train',
      'bus',
      'car-rental',
      'event',
      'restaurant',
      'other',
    ),
    status: Joi.string().valid('planned', 'booked', 'cancelled'),
    providerName: Joi.string().allow('').max(180),
    confirmationCode: Joi.string().allow('').max(120),
    startDateTime: isoDateSchema.required(),
    endDateTime: isoDateSchema.allow(null),
    location: Joi.object({
      name: Joi.string().allow('').max(180),
      address: Joi.string().allow('').max(500),
    }),
    amount: Joi.number().min(0),
    currency: Joi.string().trim().length(3),
    notes: Joi.string().allow('').max(4000),
    attachmentIds: Joi.array().items(objectIdSchema),
  }),
  createExpense: Joi.object({
    day: objectIdSchema,
    activity: objectIdSchema,
    reservation: objectIdSchema,
    title: Joi.string().trim().min(1).max(180).required(),
    category: Joi.string().valid('transport', 'stay', 'food', 'activities', 'shopping', 'documents', 'other'),
    amount: Joi.number().min(0).required(),
    currency: Joi.string().trim().length(3),
    expenseDate: isoDateSchema,
    paidBy: objectIdSchema,
    splitType: Joi.string().valid('none', 'equal', 'custom'),
    splitBetween: Joi.array().items(
      Joi.object({
        user: objectIdSchema.required(),
        amount: Joi.number().min(0),
        weight: Joi.number().min(0),
      }),
    ),
    notes: Joi.string().allow('').max(3000),
    receiptAttachment: objectIdSchema,
  }),
  upsertBudget: Joi.object({
    currency: Joi.string().trim().length(3),
    totalBudget: Joi.number().min(0),
    categoryLimits: Joi.array().items(
      Joi.object({
        category: Joi.string().valid('transport', 'stay', 'food', 'activities', 'shopping', 'documents', 'other').required(),
        limit: Joi.number().min(0).required(),
      }),
    ),
    alertThresholds: Joi.object({
      warningPercent: Joi.number().min(0),
      criticalPercent: Joi.number().min(0),
    }),
  }).min(1),
  upsertExchangeRate: Joi.object({
    baseCurrency: Joi.string().trim().length(3).uppercase().required(),
    quoteCurrency: Joi.string().trim().length(3).uppercase().required(),
    rate: Joi.number().positive().required(),
    source: Joi.string().trim().max(100),
  }),
  convertCurrencyPreview: Joi.object({
    amount: Joi.number().min(0).required(),
    fromCurrency: Joi.string().trim().length(3).uppercase().required(),
    toCurrency: Joi.string().trim().length(3).uppercase().required(),
  }),
  analyticsQuery: Joi.object({
    granularity: Joi.string().valid('day', 'week', 'month'),
    periodDays: Joi.number().integer().min(1).max(3650),
    forecastPeriods: Joi.number().integer().min(1).max(36),
  }),
  reportSnapshotCreate: Joi.object({
    reportType: Joi.string().valid('analytics', 'settlement', 'budget', 'expenses').required(),
    format: Joi.string().valid('json', 'csv').default('json'),
    filters: Joi.object(),
  }),
  reportSnapshotQuery: Joi.object({
    reportType: Joi.string().valid('analytics', 'settlement', 'budget', 'expenses'),
    download: Joi.boolean(),
  }),
}

export {
  authSchemas,
  collaborationSchemas,
  objectIdSchema,
  organizationSchemas,
  tripSchemas,
}
