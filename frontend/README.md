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
