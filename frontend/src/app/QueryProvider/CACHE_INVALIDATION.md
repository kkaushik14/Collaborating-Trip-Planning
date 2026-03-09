# TanStack Query Cache Invalidation Rules

Source for query keys: `frontend/src/app/QueryProvider/queryKeys.js`.

## Global Strategy

- Use `queryKeys.*` factories for all `useQuery` and `invalidateQueries` calls.
- After successful mutations, invalidate the narrowest resource scope first.
- Use `queryClient.removeQueries` for auth/session teardown on logout.
- Use manual `refetch` only for user-triggered refresh and diagnostics views.

## System Resource

Keys:
- `queryKeys.system.banner()`
- `queryKeys.system.health()`
- `queryKeys.system.versionedHealth()`
- `queryKeys.system.metrics()`
- `queryKeys.system.openApi()`
- `queryKeys.system.docs()`
- `queryKeys.system.uploadFile(fileName)`

Invalidate/refetch:
- No automatic invalidation from business mutations.
- Refetch health and metrics manually or via interval on diagnostics pages.

## Auth Resource

Keys:
- `queryKeys.auth.me()`

Invalidate/refetch:
- `createUserAccount`, `createUserSession`, `updateUserSession`: invalidate `queryKeys.auth.me()`.
- `deleteUserSession`: remove `queryKeys.auth.me()` and clear protected trip-scoped caches.
- On app boot with stored token: query `queryKeys.auth.me()` once to hydrate session.

## Invitations Resource (Inbox)

Keys:
- `queryKeys.invitations.mine()`

Invalidate/refetch:
- `createInvitationAcceptance`: invalidate `queryKeys.invitations.mine()`.
- `createTripInvitation`: optionally invalidate `queryKeys.invitations.mine()` if current user can receive invitations in-session.

## Trips Resource

Keys:
- `queryKeys.trips.list(filters)`
- `queryKeys.trips.detail(tripId)`

Invalidate/refetch:
- `createTrip`: invalidate trips list scope (`queryKeys.trips.root()`).
- `updateTrip`, `replaceTrip`: invalidate `queryKeys.trips.detail(tripId)` and trips list scope.
- `createTripOwnershipTransfer`: invalidate `queryKeys.trips.detail(tripId)` and trips list scope.

## Itinerary Resource

Keys:
- `queryKeys.itinerary.days(tripId)`
- `queryKeys.itinerary.activities(tripId, dayId)`

Invalidate/refetch:
- `createItineraryDay`: invalidate `days(tripId)` and `trips.detail(tripId)`.
- `createActivityCard`: invalidate `activities(tripId, dayId)` and `days(tripId)`.
- `updateActivityOrder`: invalidate `activities(tripId, dayId)` and `days(tripId)`.

## Collaboration Resource

Keys:
- `queryKeys.collaboration.invitations(tripId)`
- `queryKeys.collaboration.members(tripId)`
- `queryKeys.collaboration.comments(tripId, filters)`

Invalidate/refetch:
- `createTripInvitation`: invalidate `invitations(tripId)`.
- `updateTripMemberRole`, `deleteTripMember`, `createTripMemberReactivation`: invalidate `members(tripId)`.
- `createTripOwnershipTransfer`: invalidate `members(tripId)` and `trips.detail(tripId)`.
- `createTripComment`: invalidate `queryKeys.collaboration.root(tripId)` or the active filtered comments key.

## Organization Resource

Keys:
- `queryKeys.organization.checklists(tripId)`
- `queryKeys.organization.attachments(tripId, filters)`
- `queryKeys.organization.reservations(tripId)`
- `queryKeys.organization.expenses(tripId, filters)`
- `queryKeys.organization.budgetSummary(tripId)`
- `queryKeys.organization.overview(tripId)`

Invalidate/refetch:
- `createChecklist`, `createChecklistItem`, `updateChecklistItem`: invalidate `checklists(tripId)` and `overview(tripId)`.
- `createAttachment`, `createAttachmentUpload`: invalidate attachments scope and `overview(tripId)`.
- `createReservation`: invalidate `reservations(tripId)` and `overview(tripId)`.
- `createExpense`: invalidate expenses scope, `budgetSummary(tripId)`, `overview(tripId)`, and analytics expense/settlement keys.
- `updateTripBudget`: invalidate `budgetSummary(tripId)` and `overview(tripId)`.

## Analytics Resource

Keys:
- `queryKeys.analytics.exchangeRates(tripId)`
- `queryKeys.analytics.expenseAnalytics(tripId, filters)`
- `queryKeys.analytics.settlement(tripId)`
- `queryKeys.analytics.reportSnapshots(tripId, filters)`
- `queryKeys.analytics.reportSnapshot(tripId, snapshotId)`

Invalidate/refetch:
- `updateTripExchangeRate`: invalidate `exchangeRates(tripId)` and, when currency impacts totals, invalidate expenses and expense analytics scopes.
- `createCurrencyConversion`: no invalidation required unless conversion response is cached as a query.
- `createReportSnapshot`: invalidate report snapshots scope.
- `getReportSnapshotDownload`: no invalidation required.
