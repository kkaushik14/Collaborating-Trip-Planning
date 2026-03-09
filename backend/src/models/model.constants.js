const TRIP_ROLES = Object.freeze(['OWNER', 'EDITOR', 'VIEWER'])
const INVITABLE_ROLES = Object.freeze(['EDITOR', 'VIEWER'])

const TRIP_STATUS = Object.freeze(['draft', 'active', 'archived'])
const TRIP_VISIBILITY = Object.freeze(['private', 'shared'])

const COMMENT_TARGET_TYPES = Object.freeze(['day', 'activity'])

const CHECKLIST_TYPES = Object.freeze(['packing', 'todo', 'documents', 'custom'])

const RESERVATION_TYPES = Object.freeze([
  'flight',
  'hotel',
  'train',
  'bus',
  'car-rental',
  'event',
  'restaurant',
  'other',
])

const RESERVATION_STATUS = Object.freeze(['planned', 'booked', 'cancelled'])

const EXPENSE_CATEGORIES = Object.freeze([
  'transport',
  'stay',
  'food',
  'activities',
  'shopping',
  'documents',
  'other',
])

const SPLIT_TYPES = Object.freeze(['none', 'equal', 'custom'])

const ATTACHMENT_TARGET_TYPES = Object.freeze([
  'trip',
  'day',
  'activity',
  'reservation',
  'expense',
  'comment',
])

const STORAGE_PROVIDERS = Object.freeze(['local', 's3', 'gcs', 'azure', 'other'])

const INVITATION_STATUS = Object.freeze([
  'pending',
  'accepted',
  'declined',
  'revoked',
  'expired',
])

export {
  ATTACHMENT_TARGET_TYPES,
  CHECKLIST_TYPES,
  COMMENT_TARGET_TYPES,
  EXPENSE_CATEGORIES,
  INVITABLE_ROLES,
  INVITATION_STATUS,
  RESERVATION_STATUS,
  RESERVATION_TYPES,
  SPLIT_TYPES,
  STORAGE_PROVIDERS,
  TRIP_ROLES,
  TRIP_STATUS,
  TRIP_VISIBILITY,
}
