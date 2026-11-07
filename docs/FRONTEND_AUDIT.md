# Frontend audit and password recovery

Audit date: 2026-11-08. Production: https://trip-plan.kkos.in.

## Architecture retained

React JSX/ES modules and directory exports remain in place. Pages orchestrate hooks;
services own network requests; TanStack Query owns server state; shared UI primitives
remain presentational. No production mock authentication was enabled. Design changes
use shared tokens rather than page-specific replacement palettes.

## Changes

- Near-black dark canvas and charcoal panels, subtle navy contrast, readable secondary
  text, stronger input boundaries, and bright copper enabled actions. Disabled actions
  use separate opaque tokens. Light mode uses readable warm surfaces and brown actions.
- Registered custom font-size tokens with Tailwind's class merger so text colors do
  not accidentally remove typography sizes.
- Unique input IDs across forms, associated labels/errors, native checkbox behavior,
  keyboard menus/tabs, scrollable dialogs/sheets/tables, and reduced-motion support.
- Persistent theme initialization and guest theme controls; signed-in changes remain
  saved through the profile API. Account menus use Base UI hover/click/keyboard behavior.
- Honest footer destinations, useful authentication copy, a real landing feature anchor,
  no fabricated testimonial, and a render-error fallback rather than a blank screen.
- Correct per-trip permissions and explicit ownership transfer. Failed form submissions
  preserve entered values; successful submissions reset relevant fields.
- Local-date defaults and next-day progression, pending/unavailable controls, labeled
  enum selects, primary binary-upload UI, and repeatable report downloads.
- Member lists now include allowlisted display profiles while retaining their original
  user ID field. Service errors preserve timeout/network flags for session recovery.

## Password recovery

Public pages: `/forgot-password` and `/reset-password?token=...`.
Public APIs: `POST /api/v1/auth/forgot-password` with `{ email }`, and
`POST /api/v1/auth/reset-password` with `{ token, password }`.

Requests return the same generic success response for unknown/inactive accounts,
cooldown requests, and delivery failures. The database atomically claims a request
with a 60-second account cooldown. The service generates 32 random bytes, stores only
a SHA-256 hash, and expires links after 30 minutes. The configured `FRONTEND_BASE_URL`
is the only recovery-link origin; production requires HTTPS. SMTP processing runs in
background work retained by Vercel's lifetime helper.

Reset consumes the token atomically, checks the account/email/expiry, hashes the new
password, clears refresh credentials, and increments a credential version. Previous
access and refresh tokens then fail authentication, including races with in-flight
login/refresh token issuance. Successful reset does not automatically sign in.
Passwords require at least eight characters and at most 72 UTF-8 bytes. Tokens and
passwords are excluded from recovery logs, error details, and persisted form drafts.
Recovery responses use no-store/no-referrer and both endpoints share an IP rate limit.

Contracts: `frontend/src/services/api-contract.md`, `frontend/src/services/api/ROUTES.md`,
and backend OpenAPI. Existing SMTP settings and a correct `FRONTEND_BASE_URL` are required;
no new external email provider is needed.

## Verification

- Frontend: Jest/React Testing Library regressions for recovery, auth redirects, role
  controls, date progression, forms, tokens, keyboard primitives, themes, and toasts.
- Backend: isolated temporary MongoDB integration tests with mocked email delivery,
  including token replay, expiry, concurrent consumption, cooldown, session revocation,
  account enumeration resistance, trusted links, secret redaction, and rate limits.
- ESLint, production build, and whitespace/diff checks.
- Browser checks of production and local mocked screens, mobile forms/dialogs/navigation,
  dark/light themes, and horizontal overflow. This is not a claim of exhaustive
  assistive-technology or every-browser certification.
- Production audit records are labeled `UI Audit - desktop and mobile`, with a sample
  day/activity/checklist/expense. They were created with permission and left intact.
  No invitations/comments were sent and no account password was changed during audit.

## Remaining operational limits

- A generic reset response does not prove inbox delivery. Verify SMTP/provider logs and
  the test recipient's inbox separately; never expose a reset link in logs or screenshots.
- Recovery mail is best-effort background work, not a durable queue. IP rate limits are
  process-local and should move to shared storage if global enforcement is required.
- Bundle-size and stale Browserslist-data warnings remain; they do not fail the build.
- Local tests use installed Node 24 because the local Node 25 binary is broken. The
  repository, Vercel and CI remain configured for requested Node 26 and Mumbai (`bom1`).

See `frontend/src/styles/README.md` for the exact palette and contrast measurements.
