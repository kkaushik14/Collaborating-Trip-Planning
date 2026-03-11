# Route URLs Reference

Last updated: 2026-03-11

This file lists all URLs currently wired in the frontend app (UI routes + backend API routes consumed by service modules).

## Frontend App Routes

| URL | Access | Description |
| --- | --- | --- |
| `/` | Public | Landing page with product overview and entry CTAs. |
| `/login` | Public | Sign-in page for user authentication. |
| `/register` | Public | Account creation page for new users. |
| `/invitations` | Protected | Invitation list page with manual token acceptance form. |
| `/invitations/accept?token=<inviteToken>` | Protected | Deep-link invitation acceptance route used in email invite URLs. |
| `/trips` | Protected | Main trips listing page with links to each trip workspace. |
| `/trips/:tripId` | Protected | Parent trip route; redirects to `planning` section. |
| `/trips/:tripId/planning` | Protected | Day-wise itinerary and activities view, including reorder actions. |
| `/trips/:tripId/collaboration` | Protected | Members, invitations, roles, and comment-thread workspace. |
| `/trips/:tripId/organization` | Protected | Checklists, attachments, reservations, expenses, and budget summary. |
| `/trips/:tripId/analytics` | Protected | Trends, settlement data, exchange rates, and report snapshots. |
| `*` | Public | Not-found fallback route for unknown URLs. |

## Backend API Routes (Used by Frontend Services)

### System

| Method | URL | Description |
| --- | --- | --- |
| `GET` | `/` | Backend service banner/basic root response. |
| `GET` | `/health` | Health check endpoint for service/database status. |
| `GET` | `/api/v1/health` | Versioned health check endpoint. |
| `GET` | `/metrics` | Prometheus-style metrics endpoint. |
| `GET` | `/api/v1/openapi.json` | OpenAPI specification document. |
| `GET` | `/api/v1/docs` | Swagger UI/API docs HTML page. |
| `GET` | `/uploads/:fileName` | Fetches an uploaded file by name. |

### Auth

| Method | URL | Description |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Creates a new user account and session tokens. |
| `POST` | `/api/v1/auth/login` | Authenticates user and returns access/refresh tokens. |
| `POST` | `/api/v1/auth/refresh` | Rotates and returns fresh auth tokens. |
| `POST` | `/api/v1/auth/logout` | Terminates user session on server/client. |
| `GET` | `/api/v1/auth/me` | Returns currently authenticated user profile. |

### Invitations

| Method | URL | Description |
| --- | --- | --- |
| `GET` | `/api/v1/invitations/mine` | Lists invitations for the current user account. |
| `POST` | `/api/v1/invitations/accept` | Accepts an invitation using token/payload data. |

### Trips

| Method | URL | Description |
| --- | --- | --- |
| `POST` | `/api/v1/trips` | Creates a new trip. |
| `GET` | `/api/v1/trips` | Lists trips visible to the authenticated user. |
| `GET` | `/api/v1/trips/:tripId` | Returns a single trip with actor role context. |
| `PATCH` | `/api/v1/trips/:tripId` | Partially updates trip fields. |
| `PUT` | `/api/v1/trips/:tripId` | Replaces trip payload with full update input. |

### Trip Planning (Itinerary + Activities)

| Method | URL | Description |
| --- | --- | --- |
| `POST` | `/api/v1/trips/:tripId/days` | Creates a new itinerary day in a trip. |
| `GET` | `/api/v1/trips/:tripId/days` | Lists all itinerary days for a trip. |
| `POST` | `/api/v1/trips/:tripId/days/:dayId/activities` | Adds an activity card to a day. |
| `GET` | `/api/v1/trips/:tripId/days/:dayId/activities` | Lists activities for a specific day. |
| `PATCH` | `/api/v1/trips/:tripId/days/:dayId/activities/reorder` | Persists reordered activity IDs for a day. |

### Collaboration

| Method | URL | Description |
| --- | --- | --- |
| `POST` | `/api/v1/trips/:tripId/invitations` | Creates and sends a trip invitation. |
| `GET` | `/api/v1/trips/:tripId/invitations` | Lists invitation records for a trip. |
| `GET` | `/api/v1/trips/:tripId/members` | Lists members and roles for a trip. |
| `PATCH` | `/api/v1/trips/:tripId/members/me/comment-email-preference` | Updates current member comment email preference (`"true"`/`"false"`). |
| `PATCH` | `/api/v1/trips/:tripId/members/:memberId/role` | Updates a member role (Owner/Editor/Viewer rules apply). |
| `DELETE` | `/api/v1/trips/:tripId/members/:memberId` | Deactivates/removes a trip member. |
| `POST` | `/api/v1/trips/:tripId/members/:memberId/reactivate` | Reactivates a previously deactivated member. |
| `POST` | `/api/v1/trips/:tripId/ownership/transfer` | Transfers trip ownership to another member. |
| `POST` | `/api/v1/trips/:tripId/comments` | Creates a comment for day/activity context. |
| `GET` | `/api/v1/trips/:tripId/comments` | Lists comments with optional filtering/pagination. |

### Organization

| Method | URL | Description |
| --- | --- | --- |
| `POST` | `/api/v1/trips/:tripId/checklists` | Creates a checklist for the trip. |
| `GET` | `/api/v1/trips/:tripId/checklists` | Lists trip checklists with items. |
| `POST` | `/api/v1/trips/:tripId/checklists/:checklistId/items` | Adds an item to a checklist. |
| `PATCH` | `/api/v1/trips/:tripId/checklists/:checklistId/items/:itemId` | Updates checklist item state/details. |
| `POST` | `/api/v1/trips/:tripId/attachments` | Creates attachment metadata entry. |
| `GET` | `/api/v1/trips/:tripId/attachments` | Lists trip attachments. |
| `POST` | `/api/v1/trips/:tripId/attachments/upload` | Uploads a file and creates attachment record. |
| `POST` | `/api/v1/trips/:tripId/reservations` | Creates a manual reservation entry. |
| `GET` | `/api/v1/trips/:tripId/reservations` | Lists manual reservations. |
| `POST` | `/api/v1/trips/:tripId/expenses` | Creates an expense and updates budget context. |
| `GET` | `/api/v1/trips/:tripId/expenses` | Lists expenses for the trip. |
| `PUT` | `/api/v1/trips/:tripId/budget` | Sets/updates trip budget and limits. |
| `GET` | `/api/v1/trips/:tripId/budget/summary` | Returns budget summary and utilization stats. |
| `GET` | `/api/v1/trips/:tripId/organization/overview` | Returns compact counts/summary for org dashboard. |

### Analytics, Currency, Settlement, Reports

| Method | URL | Description |
| --- | --- | --- |
| `PUT` | `/api/v1/trips/:tripId/exchange-rates` | Creates or updates a trip-specific exchange rate. |
| `GET` | `/api/v1/trips/:tripId/exchange-rates` | Lists exchange rates configured for a trip. |
| `POST` | `/api/v1/trips/:tripId/currency/convert` | Converts amount between currencies using stored rates. |
| `GET` | `/api/v1/trips/:tripId/analytics/expenses` | Returns expense trends and forecasting data. |
| `GET` | `/api/v1/trips/:tripId/settlement` | Returns member balances and settlement suggestions. |
| `POST` | `/api/v1/trips/:tripId/reports/snapshots` | Generates and stores a report snapshot. |
| `GET` | `/api/v1/trips/:tripId/reports/snapshots` | Lists generated report snapshots. |
| `GET` | `/api/v1/trips/:tripId/reports/snapshots/:snapshotId` | Returns a specific report snapshot payload. |
| `GET` | `/api/v1/trips/:tripId/reports/snapshots/:snapshotId?download=true` | Downloads snapshot content in selected format. |
