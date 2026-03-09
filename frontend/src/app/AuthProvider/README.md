# Auth and Session Strategy

## Token model

- Uses `accessToken` + `refreshToken` from backend auth endpoints.
- Current storage choice: `localStorage` (with in-memory access-token mirror).
- Keys:
- `tripPlannerAccessToken`
- `tripPlannerRefreshToken`

## Why localStorage currently

- Current backend contract expects:
- `Authorization: Bearer <accessToken>` for protected APIs.
- `POST /api/v1/auth/refresh` body with `{ "refreshToken": "..." }`.
- No httpOnly cookie session flow is exposed by backend yet.

## Security tradeoff

- `localStorage` is vulnerable to token theft if XSS exists.
- Recommended production-hardening path:
- Move refresh token to httpOnly, secure, same-site cookie.
- Keep access token short-lived and preferably in memory.
- Use CSRF protections for cookie-based auth.

## Provider behavior

- `AuthProvider` bootstraps session from storage.
- If access token is expired and refresh token exists, provider attempts refresh automatically.
- On refresh failure or invalid session, provider clears local session state.
- `useAuth()` exposes:
- `signIn(credentials)`
- `signOut()`
- `currentUser`
- `isAuthenticated`
- `isInitializing`
- `authError`
- `refreshSession()`

## Route protection

- `ProtectedRoute` blocks child rendering until auth initialization is complete.
- Renders `loadingFallback` during bootstrap and `fallback` for unauthenticated state.
