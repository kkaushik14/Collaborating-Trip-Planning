# Collaborating Trip Planning API Contract

Last synced: 2026-03-08
Source of truth: backend routes/controllers/validators (`backend/src/routes/*.js`, `backend/src/controllers/*.js`, `backend/src/validators/schemas.js`).

## Base URL
- Local backend root: `http://localhost:5000`
- Versioned API base: `http://localhost:5000/api/v1`

## Global Rules
- All JSON endpoints use `Content-Type: application/json` unless explicitly noted.
- Protected endpoints require `Authorization: Bearer <accessToken>`.
- Object IDs are 24-char hex strings.
- ISO date-time fields use ISO 8601 strings.

## Standard Response Envelopes

### Success envelope
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success message",
  "data": {},
  "meta": {}
}
```
Notes:
- `meta` is present only when needed (pagination, etc.).
- Some download endpoints return raw CSV/JSON instead of this envelope.

### Error envelope (application errors)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "data": null,
  "meta": {
    "errors": ["\"title\" is required"],
    "requestId": "uuid"
  }
}
```
Notes:
- In non-production, `meta.stack` is also included.

### Rate-limit error shape (429)
```json
{
  "success": false,
  "message": "Too many requests, please try again later."
}
```
Auth routes use the auth-specific variant:
```json
{
  "success": false,
  "message": "Too many authentication attempts, please try again later."
}
```

## Shared Schemas

### Auth/User
```ts
type ObjectId = string; // 24-char hex
type ISODateTime = string;

type UserPublic = {
  _id: ObjectId;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

type Tokens = {
  accessToken: string;
  refreshToken: string;
};
```

### Core domain
```ts
type Trip = {
  _id: ObjectId;
  title: string;
  description: string;
  startDate: ISODateTime;
  endDate: ISODateTime;
  travelerCount: number;
  owner: ObjectId;
  status: 'draft' | 'active' | 'archived';
  visibility: 'private' | 'shared';
  settings: { currency: string; timezone: string; };
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

type ItineraryDay = {
  _id: ObjectId;
  trip: ObjectId;
  dayNumber: number;
  date: ISODateTime;
  title: string;
  notes: string;
  activityOrder: ObjectId[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

type Activity = {
  _id: ObjectId;
  trip: ObjectId;
  day: ObjectId;
  title: string;
  description: string;
  locationName: string;
  address: string;
  startTime: ISODateTime | null;
  endTime: ISODateTime | null;
  position: number;
  estimatedCost: { amount: number; currency: string; };
  createdBy: ObjectId;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

type TripMember = {
  _id: ObjectId;
  trip: ObjectId;
  user: ObjectId;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  commentEmailOptIn: 'true' | 'false';
  addedBy?: ObjectId;
  joinedAt: ISODateTime;
  isActive: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

type TripInvitation = {
  _id: ObjectId;
  trip: ObjectId;
  email: string;
  role: 'EDITOR' | 'VIEWER';
  invitedBy: ObjectId;
  tokenHash: string;
  status: 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';
  expiresAt: ISODateTime;
  respondedAt: ISODateTime | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

type Comment = {
  _id: ObjectId;
  trip: ObjectId;
  author: ObjectId;
  targetType: 'day' | 'activity';
  day: ObjectId | null;
  activity: ObjectId | null;
  body: string;
  parentComment: ObjectId | null;
  mentions: ObjectId[];
  isEdited: boolean;
  deletedAt: ISODateTime | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

type ChecklistItem = {
  _id: ObjectId;
  label: string;
  isCompleted: boolean;
  sortOrder: number;
  assignee: ObjectId | null;
  dueDate: ISODateTime | null;
  completedAt: ISODateTime | null;
  completedBy: ObjectId | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

type Checklist = {
  _id: ObjectId;
  trip: ObjectId;
  title: string;
  type: 'packing' | 'todo' | 'documents' | 'custom';
  createdBy: ObjectId;
  items: ChecklistItem[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

type Attachment = {
  _id: ObjectId;
  trip: ObjectId;
  uploadedBy: ObjectId;
  targetType: 'trip' | 'day' | 'activity' | 'reservation' | 'expense' | 'comment';
  day: ObjectId | null;
  activity: ObjectId | null;
  reservation: ObjectId | null;
  expense: ObjectId | null;
  comment: ObjectId | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageProvider: 'local' | 's3' | 'gcs' | 'azure' | 'other';
  storageKey: string;
  url: string;
  metadata: Record<string, unknown>;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

type Reservation = {
  _id: ObjectId;
  trip: ObjectId;
  createdBy: ObjectId;
  title: string;
  reservationType: 'flight' | 'hotel' | 'train' | 'bus' | 'car-rental' | 'event' | 'restaurant' | 'other';
  status: 'planned' | 'booked' | 'cancelled';
  providerName: string;
  confirmationCode: string;
  startDateTime: ISODateTime;
  endDateTime: ISODateTime | null;
  location: { name: string; address: string; };
  amount: number;
  currency: string;
  notes: string;
  attachmentIds: ObjectId[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

type Expense = {
  _id: ObjectId;
  trip: ObjectId;
  day: ObjectId | null;
  activity: ObjectId | null;
  reservation: ObjectId | null;
  createdBy: ObjectId;
  paidBy: ObjectId;
  title: string;
  category: 'transport' | 'stay' | 'food' | 'activities' | 'shopping' | 'documents' | 'other';
  amount: number;
  normalizedAmount: number;
  currency: string;
  normalizedCurrency: string;
  exchangeRateApplied: number;
  expenseDate: ISODateTime;
  splitType: 'none' | 'equal' | 'custom';
  splitBetween: { user: ObjectId; amount?: number; weight?: number; }[];
  notes: string;
  receiptAttachment: ObjectId | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

type BudgetSummary = {
  expenseCount: number;
  spentByCategory: Record<string, number>;
  spentTotal: number;
};

type TripBudget = {
  _id: ObjectId;
  trip: ObjectId;
  currency: string;
  totalBudget: number;
  categoryLimits: { category: string; limit: number; }[];
  summary: {
    spentTotal: number;
    remaining: number;
    spentByCategory: Record<string, number>;
    lastCalculatedAt: ISODateTime | null;
  };
  alertThresholds: { warningPercent: number; criticalPercent: number; };
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

type ExchangeRate = {
  _id: ObjectId;
  trip: ObjectId;
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  source: string;
  asOf: ISODateTime;
  createdBy: ObjectId;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

type ReportSnapshot = {
  _id: ObjectId;
  trip: ObjectId;
  reportType: 'analytics' | 'settlement' | 'budget' | 'expenses';
  format: 'json' | 'csv';
  createdBy: ObjectId;
  filters: Record<string, unknown>;
  payload: unknown;
  generatedAt: ISODateTime;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};
```

## Endpoint Contract

## 0) System and Utility

### `GET /`
- Auth: none
- Headers: none required
- Body: none
- Success: `200` with `data: null` (service banner message)
- Errors: `500`

### `GET /health`
- Auth: none
- Headers: none required
- Body: none
- Success: `200` with `data: { service: string; database: 'connected' | 'disconnected'; timestamp: ISODateTime }`
- Errors: `500`

### `GET /metrics`
- Auth: none
- Headers: none required
- Body: none
- Success: `200`, plain text Prometheus metrics (`text/plain`)
- Errors: `500`

### `GET /api/v1/health`
- Auth: none
- Headers: none required
- Body: none
- Success: same as `GET /health`
- Errors: `500`

### `GET /api/v1/openapi.json` (only when `DOCS_ENABLED !== 'false'`)
- Auth: none
- Headers: none required
- Body: none
- Success: `200` OpenAPI JSON

### `GET /api/v1/docs` (only when `DOCS_ENABLED !== 'false'`)
- Auth: none
- Headers: none required
- Body: none
- Success: `200` Swagger UI HTML

### `GET /uploads/:fileName`
- Auth: none
- Headers: none required
- Body: none
- Success: `200` static file bytes if file exists
- Errors: static 404 for missing file

## 1) Authentication

### `POST /api/v1/auth/register`
- Auth: none
- Required headers: `Content-Type: application/json`
- Body:
```json
{
  "name": "string (2..120)",
  "email": "valid email",
  "password": "string (8..128)"
}
```
- Success: `201`, `data: { user: UserPublic, tokens: Tokens }`
- Errors: `400`, `409`, `429`, `500`

### `POST /api/v1/auth/login`
- Auth: none
- Required headers: `Content-Type: application/json`
- Body:
```json
{
  "email": "valid email",
  "password": "string (8..128)"
}
```
- Success: `200`, `data: { user: UserPublic, tokens: Tokens }`
- Errors: `400`, `401`, `429`, `500`

### `POST /api/v1/auth/refresh`
- Auth: none
- Required headers: `Content-Type: application/json`
- Body:
```json
{ "refreshToken": "string" }
```
- Success: `200`, `data: { tokens: Tokens }`
- Errors: `400`, `401`, `429`, `500`

### `POST /api/v1/auth/logout`
- Auth: Bearer required
- Required headers: `Authorization`, `Content-Type: application/json` (optional body)
- Body: none
- Success: `200`, `data: null`
- Errors: `401`, `429`, `500`

### `GET /api/v1/auth/me`
- Auth: Bearer required
- Required headers: `Authorization`
- Body: none
- Success: `200`, `data: { user: UserPublic }`
- Errors: `401`, `429`, `500`

## 2) Invitation Inbox

### `GET /api/v1/invitations/mine`
- Auth: Bearer required
- Required headers: `Authorization`
- Body: none
- Success: `200`, `data: { invitations: TripInvitation[] }` (pending + non-expired for current user)
- Errors: `401`, `429`, `500`

### `POST /api/v1/invitations/accept`
- Auth: Bearer required
- Required headers: `Authorization`, `Content-Type: application/json`
- Body:
```json
{ "token": "string" }
```
- Success: `200`, `data: { invitation: TripInvitation, member: TripMember }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

## 3) Trips and Itinerary

### `POST /api/v1/trips`
- Auth: Bearer required
- Headers: `Authorization`, `Content-Type: application/json`
- Body:
```json
{
  "title": "string (3..140)",
  "description": "string (<=2000, optional)",
  "startDate": "ISODateTime",
  "endDate": "ISODateTime",
  "travelerCount": 1,
  "travelers": 1,
  "settings": { "currency": "USD", "timezone": "UTC" }
}
```
- Success: `201`, `data: { trip: Trip }`
- Errors: `400`, `401`, `429`, `500`

### `GET /api/v1/trips`
- Auth: Bearer required
- Headers: `Authorization`
- Body: none
- Success: `200`, `data: { trips: (Trip & { actorRole: 'OWNER' | 'EDITOR' | 'VIEWER' })[] }`
- Errors: `401`, `429`, `500`

### `GET /api/v1/trips/:tripId`
- Auth: Bearer required
- Trip permission: `VIEW_TRIP`
- Headers: `Authorization`
- Params: `tripId`
- Success: `200`, `data: { trip: Trip, actorRole: 'OWNER' | 'EDITOR' | 'VIEWER' }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `PATCH /api/v1/trips/:tripId`
### `PUT /api/v1/trips/:tripId`
- Auth: Bearer required
- Trip permission: `MANAGE_ITINERARY`
- Headers: `Authorization`, `Content-Type: application/json`
- Params: `tripId`
- Body: any non-empty subset of create fields plus:
```json
{ "status": "draft|active|archived", "visibility": "private|shared" }
```
- Success: `200`, `data: { trip: Trip }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `POST /api/v1/trips/:tripId/days`
- Auth: Bearer required
- Trip permission: `MANAGE_ITINERARY`
- Headers: `Authorization`, `Content-Type: application/json`
- Body:
```json
{ "dayNumber": 1, "date": "ISODateTime", "title": "", "notes": "" }
```
- Success: `201`, `data: { day: ItineraryDay }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `GET /api/v1/trips/:tripId/days`
- Auth: Bearer required
- Trip permission: `VIEW_TRIP`
- Headers: `Authorization`
- Success: `200`, `data: { days: (ItineraryDay & { activities: Activity[] })[] }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `POST /api/v1/trips/:tripId/days/:dayId/activities`
- Auth: Bearer required
- Trip permission: `MANAGE_ITINERARY`
- Headers: `Authorization`, `Content-Type: application/json`
- Body:
```json
{
  "title": "string",
  "description": "",
  "locationName": "",
  "address": "",
  "startTime": "ISODateTime|null",
  "endTime": "ISODateTime|null",
  "estimatedCost": { "amount": 0, "currency": "USD" }
}
```
- Success: `201`, `data: { activity: Activity }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `GET /api/v1/trips/:tripId/days/:dayId/activities`
- Auth: Bearer required
- Trip permission: `VIEW_TRIP`
- Headers: `Authorization`
- Success: `200`, `data: { day: ItineraryDay, activities: Activity[] }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `PATCH /api/v1/trips/:tripId/days/:dayId/activities/reorder`
- Auth: Bearer required
- Trip permission: `MANAGE_ITINERARY`
- Headers: `Authorization`, `Content-Type: application/json`
- Body:
```json
{ "activityIds": ["<ObjectId>"] }
```
- Success: `200`, `data: { day: ItineraryDay, activities: Activity[] }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

## 4) Collaboration (Trip-scoped)

### `POST /api/v1/trips/:tripId/invitations`
- Auth: Bearer required
- Trip permission: `INVITE_MEMBERS`
- Headers: `Authorization`, `Content-Type: application/json`
- Body:
```json
{ "email": "valid email", "role": "EDITOR|VIEWER", "expiresInDays": 7 }
```
- Success: `201`, `data: { invitation: TripInvitation, inviteToken: string, inviteUrl: string }`
- Errors: `400`, `401`, `403`, `404`, `409`, `429`, `500`

### `GET /api/v1/trips/:tripId/invitations`
- Auth: Bearer required
- Trip permission: `INVITE_MEMBERS`
- Headers: `Authorization`
- Success: `200`, `data: { invitations: TripInvitation[] }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `GET /api/v1/trips/:tripId/members`
- Auth: Bearer required
- Trip permission: `VIEW_TRIP`
- Headers: `Authorization`
- Success: `200`, `data: { members: TripMember[] }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `PATCH /api/v1/trips/:tripId/members/me/comment-email-preference`
- Auth: Bearer required
- Trip permission: `VIEW_TRIP`
- Headers: `Authorization`, `Content-Type: application/json`
- Body:
```json
{ "commentEmailOptIn": "true|false" }
```
- Notes:
  - Backend normalizes booleans to string values.
  - Stored as string enum in member record: `"true"` (opt-in), `"false"` (opt-out).
- Success: `200`, `data: { member: TripMember }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `PATCH /api/v1/trips/:tripId/members/:memberId/role`
- Auth: Bearer required
- Trip permission: `MANAGE_MEMBER_ROLES`
- Headers: `Authorization`, `Content-Type: application/json`
- Body:
```json
{ "role": "EDITOR|VIEWER|OWNER" }
```
Notes: API validation allows `OWNER`, but controller rejects direct OWNER assignment; use ownership transfer endpoint.
- Success: `200`, `data: { member: TripMember }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `DELETE /api/v1/trips/:tripId/members/:memberId`
- Auth: Bearer required
- Trip permission: `MANAGE_MEMBER_ROLES`
- Headers: `Authorization`
- Success: `200`, `data: { member: TripMember }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `POST /api/v1/trips/:tripId/members/:memberId/reactivate`
- Auth: Bearer required
- Trip permission: `MANAGE_MEMBER_ROLES`
- Headers: `Authorization`
- Success: `200`, `data: { member: TripMember }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `POST /api/v1/trips/:tripId/ownership/transfer`
- Auth: Bearer required
- Trip permission: `MANAGE_MEMBER_ROLES` (current owner flow)
- Headers: `Authorization`, `Content-Type: application/json`
- Body:
```json
{ "newOwnerUserId": "<ObjectId>" }
```
- Success: `200`, `data: { trip: Trip, previousOwnerMember: TripMember, newOwnerMember: TripMember }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `POST /api/v1/trips/:tripId/comments`
- Auth: Bearer required
- Trip permission: `COMMENT`
- Headers: `Authorization`, `Content-Type: application/json`
- Body:
```json
{
  "targetType": "day|activity",
  "dayId": "<ObjectId>",
  "activityId": "<ObjectId>",
  "body": "string",
  "parentComment": "<ObjectId>|null",
  "mentions": ["<ObjectId>"]
}
```
- Success: `201`, `data: { comment: Comment }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `GET /api/v1/trips/:tripId/comments`
- Auth: Bearer required
- Trip permission: `VIEW_TRIP`
- Headers: `Authorization`
- Query (optional):
```json
{
  "targetType": "day|activity",
  "dayId": "<ObjectId>",
  "activityId": "<ObjectId>",
  "page": 1,
  "limit": 20
}
```
- Success: `200`, `data: { comments: Comment[] }`, `meta: { page, limit, total, totalPages }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

## 5) Organization

### `POST /api/v1/trips/:tripId/checklists`
- Auth: Bearer required
- Trip permission: `MANAGE_ORGANIZATION`
- Headers: `Authorization`, `Content-Type: application/json`
- Body:
```json
{ "title": "string", "type": "packing|todo|documents|custom" }
```
- Success: `201`, `data: { checklist: Checklist }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `GET /api/v1/trips/:tripId/checklists`
- Auth: Bearer required
- Trip permission: `VIEW_TRIP`
- Headers: `Authorization`
- Success: `200`, `data: { checklists: Checklist[] }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `POST /api/v1/trips/:tripId/checklists/:checklistId/items`
- Auth: Bearer required
- Trip permission: `MANAGE_ORGANIZATION`
- Headers: `Authorization`, `Content-Type: application/json`
- Body:
```json
{ "label": "string", "assignee": "<ObjectId>|null", "dueDate": "ISODateTime|null" }
```
- Success: `201`, `data: { item: ChecklistItem, checklist: Checklist }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `PATCH /api/v1/trips/:tripId/checklists/:checklistId/items/:itemId`
- Auth: Bearer required
- Trip permission: `MANAGE_ORGANIZATION`
- Headers: `Authorization`, `Content-Type: application/json`
- Body (any non-empty subset):
```json
{
  "label": "string",
  "isCompleted": true,
  "assignee": "<ObjectId>|null",
  "dueDate": "ISODateTime|null",
  "sortOrder": 0
}
```
- Success: `200`, `data: { item: ChecklistItem, checklist: Checklist }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `POST /api/v1/trips/:tripId/attachments`
- Auth: Bearer required
- Trip permission: `MANAGE_ORGANIZATION`
- Headers: `Authorization`, `Content-Type: application/json`
- Body:
```json
{
  "fileName": "string",
  "mimeType": "string",
  "sizeBytes": 123,
  "targetType": "trip|day|activity|reservation|expense|comment",
  "storageProvider": "local|s3|gcs|azure|other",
  "storageKey": "string",
  "url": "string",
  "metadata": {},
  "dayId": "<ObjectId>",
  "activityId": "<ObjectId>",
  "reservationId": "<ObjectId>",
  "expenseId": "<ObjectId>",
  "commentId": "<ObjectId>"
}
```
- Success: `201`, `data: { attachment: Attachment }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `GET /api/v1/trips/:tripId/attachments`
- Auth: Bearer required
- Trip permission: `VIEW_TRIP`
- Headers: `Authorization`
- Query (optional):
```json
{ "targetType": "trip|day|activity|reservation|expense|comment" }
```
- Success: `200`, `data: { attachments: Attachment[] }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `POST /api/v1/trips/:tripId/attachments/upload`
- Auth: Bearer required
- Trip permission: `MANAGE_ORGANIZATION`
- Headers: `Authorization`, `Content-Type: multipart/form-data`
- Form-data fields:
  - `file` (required): image/* or application/pdf, max 10MB
  - `targetType` (optional, default `trip`)
  - target refs based on type: `dayId`, `activityId`, `reservationId`, `expenseId`, `commentId`
  - `metadata` (optional)
- Success: `201`, `data: { attachment: Attachment }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `POST /api/v1/trips/:tripId/reservations`
- Auth: Bearer required
- Trip permission: `MANAGE_ORGANIZATION`
- Headers: `Authorization`, `Content-Type: application/json`
- Body:
```json
{
  "title": "string",
  "reservationType": "flight|hotel|train|bus|car-rental|event|restaurant|other",
  "status": "planned|booked|cancelled",
  "providerName": "string",
  "confirmationCode": "string",
  "startDateTime": "ISODateTime",
  "endDateTime": "ISODateTime|null",
  "location": { "name": "string", "address": "string" },
  "amount": 0,
  "currency": "USD",
  "notes": "string",
  "attachmentIds": ["<ObjectId>"]
}
```
- Success: `201`, `data: { reservation: Reservation }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `GET /api/v1/trips/:tripId/reservations`
- Auth: Bearer required
- Trip permission: `VIEW_TRIP`
- Headers: `Authorization`
- Success: `200`, `data: { reservations: Reservation[] }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `POST /api/v1/trips/:tripId/expenses`
- Auth: Bearer required
- Trip permission: `MANAGE_ORGANIZATION`
- Headers: `Authorization`, `Content-Type: application/json`
- Body:
```json
{
  "day": "<ObjectId>",
  "activity": "<ObjectId>",
  "reservation": "<ObjectId>",
  "title": "string",
  "category": "transport|stay|food|activities|shopping|documents|other",
  "amount": 0,
  "currency": "USD",
  "expenseDate": "ISODateTime",
  "paidBy": "<ObjectId>",
  "splitType": "none|equal|custom",
  "splitBetween": [{ "user": "<ObjectId>", "amount": 0, "weight": 0 }],
  "notes": "string",
  "receiptAttachment": "<ObjectId>"
}
```
- Success: `201`, `data: { expense: Expense, conversion: { amount, fromCurrency, toCurrency, rate, convertedAmount, source, inverseApplied }, budgetSummary: BudgetSummary, tripBudget: TripBudget }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `GET /api/v1/trips/:tripId/expenses`
- Auth: Bearer required
- Trip permission: `VIEW_TRIP`
- Headers: `Authorization`
- Query (optional):
```json
{ "category": "transport|stay|food|activities|shopping|documents|other", "page": 1, "limit": 20 }
```
- Success: `200`, `data: { expenses: Expense[] }`, `meta: { page, limit, total, totalPages }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `PUT /api/v1/trips/:tripId/budget`
- Auth: Bearer required
- Trip permission: `MANAGE_ORGANIZATION`
- Headers: `Authorization`, `Content-Type: application/json`
- Body (any non-empty subset):
```json
{
  "currency": "USD",
  "totalBudget": 1000,
  "categoryLimits": [{ "category": "food", "limit": 300 }],
  "alertThresholds": { "warningPercent": 80, "criticalPercent": 100 }
}
```
- Success: `200`, `data: { budget: TripBudget, summary: BudgetSummary }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `GET /api/v1/trips/:tripId/budget/summary`
- Auth: Bearer required
- Trip permission: `VIEW_TRIP`
- Headers: `Authorization`
- Success: `200`, `data: { budget: TripBudget, summary: BudgetSummary, utilizationPercent: number }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `GET /api/v1/trips/:tripId/organization/overview`
- Auth: Bearer required
- Trip permission: `VIEW_TRIP`
- Headers: `Authorization`
- Success: `200`, `data: { checklists: number, attachments: number, reservations: number, expenses: BudgetSummary }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

## 6) Analytics, Currency, Settlement, Snapshots

### `PUT /api/v1/trips/:tripId/exchange-rates`
- Auth: Bearer required
- Trip permission: `MANAGE_ORGANIZATION`
- Headers: `Authorization`, `Content-Type: application/json`
- Body:
```json
{ "baseCurrency": "EUR", "quoteCurrency": "USD", "rate": 1.1, "source": "manual" }
```
- Success: `200`, `data: { exchangeRate: ExchangeRate }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `GET /api/v1/trips/:tripId/exchange-rates`
- Auth: Bearer required
- Trip permission: `VIEW_TRIP`
- Headers: `Authorization`
- Success: `200`, `data: { exchangeRates: ExchangeRate[] }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `POST /api/v1/trips/:tripId/currency/convert`
- Auth: Bearer required
- Trip permission: `VIEW_TRIP`
- Headers: `Authorization`, `Content-Type: application/json`
- Body:
```json
{ "amount": 50, "fromCurrency": "EUR", "toCurrency": "USD" }
```
- Success: `200`, `data: { conversion: { amount, fromCurrency, toCurrency, rate, convertedAmount, source, inverseApplied } }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `GET /api/v1/trips/:tripId/analytics/expenses`
- Auth: Bearer required
- Trip permission: `VIEW_TRIP`
- Headers: `Authorization`
- Query (optional):
```json
{ "granularity": "day|week|month", "periodDays": 180, "forecastPeriods": 3 }
```
- Success: `200`, `data: { analytics: { granularity, periodDays, fromDate, toDate, totals: { totalSpent, averagePerPeriod, periodCount, expenseCount }, trend: { period, total, periodIndex }[], byCategory: { category, total }[], forecast: { periodIndex, projectedTotal, method }[] } }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `GET /api/v1/trips/:tripId/settlement`
- Auth: Bearer required
- Trip permission: `VIEW_TRIP`
- Headers: `Authorization`
- Success: `200`, `data: { settlement: { tripId, currency, participantCount, expenseCount, balances: { userId, paid, owed, net }[], settlements: { fromUserId, toUserId, amount, currency }[], totals: { totalPaid, totalOwed } } }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `POST /api/v1/trips/:tripId/reports/snapshots`
- Auth: Bearer required
- Trip permission: `VIEW_TRIP`
- Headers: `Authorization`, `Content-Type: application/json`
- Body:
```json
{
  "reportType": "analytics|settlement|budget|expenses",
  "format": "json|csv",
  "filters": {}
}
```
- Success: `201`, `data: { snapshot: ReportSnapshot }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `GET /api/v1/trips/:tripId/reports/snapshots`
- Auth: Bearer required
- Trip permission: `VIEW_TRIP`
- Headers: `Authorization`
- Query (optional):
```json
{ "reportType": "analytics|settlement|budget|expenses", "download": true }
```
Note: `download` is accepted by validator but not used in list logic.
- Success: `200`, `data: { snapshots: ReportSnapshot[] }`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

### `GET /api/v1/trips/:tripId/reports/snapshots/:snapshotId`
- Auth: Bearer required
- Trip permission: `VIEW_TRIP`
- Headers: `Authorization`
- Query (optional):
```json
{ "download": true }
```
- Success:
  - `200` JSON envelope when `download` is absent/false: `data: { snapshot: ReportSnapshot }`
  - `200` raw file download when `download=true`:
    - CSV (`text/csv`) if snapshot format is `csv`
    - JSON file (`application/json`) if snapshot format is `json`
- Errors: `400`, `401`, `403`, `404`, `429`, `500`

## 7) Common Protected-Route Authorization Behavior
- Missing bearer token: `401` (`Authorization Bearer token is required`)
- Invalid/expired token: `401`
- Not a trip member/owner for trip route: `403`
- Lacking route permission for role: `403`

Role permissions used by backend:
- `OWNER`: all trip permissions
- `EDITOR`: `VIEW_TRIP`, `MANAGE_ITINERARY`, `INVITE_MEMBERS`, `COMMENT`, `MANAGE_ORGANIZATION`
- `VIEWER`: `VIEW_TRIP`, `COMMENT`

## 8) Generic Non-Endpoint Errors
- Unknown route: `404`, message like `Route not found: /path`
- Validation failure: `400`, message `Validation failed`, details in `meta.errors[]`
- Unhandled server error: `500`
