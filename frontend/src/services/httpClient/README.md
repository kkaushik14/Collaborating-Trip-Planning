# HTTP Client Contract

`frontend/src/services/httpClient/index.js` is the single HTTP client abstraction for frontend network access.

## Current Behavior

- Centralizes API base URL from `frontend/src/config/api.js`.
- Applies request timeout handling (default from `VITE_API_TIMEOUT_MS`).
- Applies default headers and request-level header overrides.
- Retrieves auth token via provider (default: `localStorage` lookup) and attaches `Authorization: Bearer <token>` unless `skipAuth` is enabled.
- Maps API and network failures into a consistent `HttpClientError` shape.

## Planned Interceptors (Design Only, Not Implemented Yet)

Request interceptor plan:
- Read current access token from token provider.
- Attach `Authorization` header for protected routes.
- Skip attach when endpoint is explicitly public or when caller sets `skipAuth: true`.

Response interceptor plan:
- On `401`, attempt a single refresh token flow through an auth service module.
- Queue concurrent `401` requests while refresh is in progress.
- Replay queued requests after successful refresh with the new access token.
- If refresh fails, clear auth session and surface a normalized unauthorized error for UI redirect/login handling.

## Usage Rule

- Raw network calls (`fetch`/`axios`) must stay inside `frontend/src/services/*`.
- UI components should call service modules only and must never call `fetch`/`axios` directly.
