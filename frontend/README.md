# Frontend

Vite + React (JSX) project with TailwindCSS configured.

## Commands

- `npm run dev` - start frontend dev server
- `npm run build` - build production assets
- `npm run preview` - preview production build locally

## Vercel deployment

Deploy from the repository root using the shared [Vercel guide](../docs/VERCEL.md).
`frontend/.env.production.example` lists public build variables. The root
`npm run env:vercel` command generates the ignored production file. Keep API mocks
disabled and use `/api/v1` for the API base URL on this same-domain deployment.

## Password recovery

Login includes a Forgot password link. `/forgot-password` uses react-hook-form and
Zod to request a reset; `/reset-password?token=...` validates matching passwords
and submits through auth service hooks. Neither passwords nor reset tokens are
saved as drafts. Inputs remain on errors; success clears them and signs out the
old local session. The page never automatically authenticates after a reset.
The document uses a no-referrer policy to avoid leaking recovery URLs to links.

See [API contract](src/services/api-contract.md) and [route reference](src/services/api/ROUTES.md)
for endpoint bodies, statuses, expiry, and rate limits. Mock recovery responses
exist for isolated UI development only; production uses the real email flow.
