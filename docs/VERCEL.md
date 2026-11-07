# Deploy to Vercel

## Current production deployment

- Application: https://trip-plan.kkos.in
- Health: https://trip-plan.kkos.in/health
- Vercel project: collaborating-trip-planning-xhra
- DNS: CNAME `trip-plan` points to `09bf5ba8647a815e.vercel-dns-017.com`
  in Hostinger, with TTL 300. Other kkos.in records are unchanged.
- FRONTEND_BASE_URL and CORS_ORIGIN: `https://trip-plan.kkos.in`.
  VITE_API_BASE_URL remains `/api/v1` for same-origin requests.
- Future domain changes require updating both backend URL variables and
  redeploying so invitation and notification emails use the correct origin.

## Project configuration

Deploy this repository as **one Vercel project**, with Root Directory set to the
repository root (not frontend or backend), Application Preset **Services**, and Node.js
**26.x**. The root and both service package.json files pin this Node.js major;
GitHub CI also uses Node.js 26. The root vercel.json defines two independently built services:
`backend` (Express, entrypoint backend/index.js) and `frontend` (Vite, output dist).
No PM2 or Docker is needed. Clear any old project-wide install/build/output overrides.

Function execution is pinned to **Mumbai, India (`bom1`)** by the root `regions`
setting. Static frontend assets remain on Vercel's global CDN. Build location may
differ from the runtime region. This does not relocate MongoDB; configure your
Atlas cluster in Mumbai separately if database locality is required.

The frontend install command is `npm ci --include=dev`: Vite, Tailwind, and other
build tools are dev dependencies and must be installed even when the shared
environment sets NODE_ENV=production. The backend uses `npm ci --omit=dev`.

The backend receives `/api/*`, `/health`, `/metrics`, and `/uploads/*` with their
original paths. The final catch-all sends other requests to the frontend. Its
service-level rewrites in the root vercel.json supply the React Router fallback;
frontend/vercel.json retains the same fallback for standalone frontend deployments.
No internal bindings are needed:
the frontend is browser JavaScript calling the public same-origin `/api/v1` URL,
not a server process calling a private service. Never expose an internal binding URL
in a VITE_ variable.

## Environment setup

1. Run `npm run env:vercel` from the repository root. This creates
   `.env.vercel.local` with two independent cryptographically random JWT secrets
   and `frontend/.env.production` with real API mode enabled. Existing files are
   never overwritten. Both are ignored by Git; do not commit or share secrets.
2. Edit `.env.vercel.local`: replace MONGO_URI with your MongoDB Atlas connection
   string, including a database user's credentials. URL-encode special password
   characters. Configure Atlas network access for your deployment's outbound
   connectivity. Use a separate database and secrets for Preview deployments.
3. Replace SMTP_USER, SMTP_PASS and SMTP_FROM with your mail account and provider
   credentials. Gmail requires an app password, not your account password.
   Database credentials and SMTP passwords must be obtained from those providers;
   the generator can only generate application signing secrets.
4. Set FRONTEND_BASE_URL and CORS_ORIGIN to your stable HTTPS Vercel domain or custom
   domain, e.g. https://your-project.vercel.app. No trailing /api/v1. If left blank,
   the current VERCEL_URL is used. Do not use a production URL for preview emails.
5. Import the file in Vercel > Project > Settings > Environment Variables for
   Production. Vercel does not load this local file automatically. All VITE_ values
   are public and injected at build time; keep JWT, Mongo and SMTP credentials out
   of them. VERCEL and VERCEL_URL are supplied by Vercel; do not define them yourself.
6. Connect the GitHub repository, select main as Production Branch, and deploy.
   Redeploy after changing environment variables. On first deployment you can use
   the automatic domain fallback, then set the stable domain and redeploy.

## Runtime behavior

- `/api/*`, `/health`, `/metrics`, and `/uploads/*` reach Express. Static assets
  are served directly, and other paths fall back to index.html for React Router.
  Refreshing /trips/:id/planning or opening an invitation link works directly.
- MongoDB connections are reused within each function instance with a small pool;
  concurrent cold requests share one connection attempt and failed attempts retry.
- Vercel uploads use MongoDB GridFS. Local development still defaults to disk;
  set UPLOAD_STORAGE=gridfs locally to exercise the deployment storage path.
  Existing EC2 disk uploads are not migrated automatically. They must be uploaded
  again or migrated separately. GridFS files consume MongoDB storage capacity.
- Uploads are limited to **4 MiB on Vercel**, versus 10 MiB locally, to leave room
  for multipart overhead under Vercel's 4.5 MB function payload limit. Larger files
  need a future direct-to-object-storage flow. Oversized platform requests may be
  rejected before Express handles them. Large report responses have the same limit.
- Uploaded file URLs retain the existing bearer-link access behavior: anyone with
  the URL can download. Treat these URLs as private. This change does not add an
  authenticated file-download endpoint.
- Welcome/trip emails, audit writes, and delayed comment emails use waitUntil.
  Vercel comment notifications run once per queued comment after three seconds;
  local mode retains its per-thread debounce. Recipient opt-in checks still apply.
  These tasks are best effort within the 60-second function duration, not a durable
  queue with retries or exactly-once guarantees. SMTP timeouts are bounded.
- Rate limits and /metrics are currently per function instance. Configure Vercel
  Firewall rate limiting for deployment-wide protection; the in-process counters
  do not provide a global quota across instances.
- Docs use a relative API URL. Set DOCS_ENABLED=false to hide them after testing.
- The EC2 GitHub job now requires the repository variable DEPLOY_TO_EC2=true.
  Leave it unset for Vercel; Vercel's Git integration handles deployment. CI still
  runs checks. Vercel deployments are not gated on CI completion by this config.

## Verify after deployment

1. GET https://your-project.vercel.app/health: database should be connected.
2. Register and log in; confirm real users/tokens, then refresh a protected route.
3. Create a trip, invite another user, and open the emailed invitation link.
4. Upload a small PDF/image, then download it after a redeploy (persistence check).
5. Opt into comment emails on a second account; post a comment from the first.
6. Check /api/v1/openapi.json and confirm unknown API paths return JSON, not HTML.

References: [Vercel Services](https://vercel.com/docs/services),
[Vercel configuration](https://vercel.com/docs/project-configuration/vercel-json),
[function limits](https://vercel.com/docs/functions/limitations),
[background tasks](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package).
