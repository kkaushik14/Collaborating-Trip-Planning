# Collaborating Trip Planning

## Project Overview
Collaborating Trip Planning is a full-stack web application to plan trips with team collaboration, itinerary building, organization workflows, and budget analytics.

The project is split into:
- `frontend/` - React + Vite + Tailwind + shadcn/ui
- `backend/` - Express + MongoDB (Mongoose) API

## ER Diagram (Eraser)

[View on Eraser![](https://app.eraser.io/workspace/RoWfp6FC1P9RhS3E93Fy/preview?diagram=lib39_z6TGE-BowObAxTP&type=embed)](https://app.eraser.io/workspace/RoWfp6FC1P9RhS3E93Fy?diagram=lib39_z6TGE-BowObAxTP)

## User Flow Diagram

![User Flow Mindmap](https://ik.imagekit.io/kk24/image.png)

### Role Decision Logic
- Login/Register does **not** assign `OWNER/EDITOR/VIEWER` globally.
- Role is resolved **per trip**:
  - Trip creator => `OWNER`
  - Invite acceptance => invited role (`EDITOR` or `VIEWER`)
  - Ownership transfer / member-role update can change role later

## Features Implemented

### 1. Trip Planning
- Create and update trips (title, dates, travelers, settings)
- Day-wise itinerary management
- Activity card creation and reordering
- Trip-level role context (`actorRole`) propagation to frontend pages

### 2. Collaboration
- Invitation flow (create invite, list invites, accept via token)
- Email deep-link acceptance route support: `/invitations/accept?token=...` (with auth redirect preserving token query)
- Role model: `OWNER`, `EDITOR`, `VIEWER`
- Ownership transfer and member activate/deactivate
- Comment system for day/activity targets

### 3. Organization
- Checklists and checklist items
- Attachments (metadata + file upload pipeline)
- Manual reservations
- Expenses + budget summary

### 4. Analytics and Reporting
- Expense analytics (trend + forecasting)
- Exchange rate management and currency conversion
- Settlement report generation per member
- Report snapshots and snapshot download flow

### 5. Auth and Platform
- Register, login, refresh, logout, current-user endpoints
- JWT access/refresh token strategy
- API error/response utilities, async handler, validation, rate limit, audit hooks
- OpenAPI/Swagger and health/metrics endpoints

### 6. Frontend Architecture
- Centralized HTTP client and service modules
- TanStack Query for server-state
- Route guards via auth provider
- Role-aware UI behavior for protected pages
- Global UI toast notifications for async success/error feedback (including invitation acceptance)
- Jest + React Testing Library setup with CI workflow

## Monorepo Structure

```text
.
├── backend/
│   ├── src/
│   └── tests/
├── frontend/
│   ├── src/
│   └── ...
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 20+ (recommended)
- npm 10+
- MongoDB running locally (or a Mongo URI – Atlas)

### 1. Clone and move to project
```bash
git clone https://github.com/kkaushik14/Collaborating-Trip-Planning.git
cd "Collaborating Trip Planning"
```

### 2. Backend setup
```bash
cd backend
cp .env.example .env
npm i
npm run dev
```

Backend runs on `http://localhost:5000` by default.

Useful local endpoints:
- Health: `GET /health`
- API docs: `GET /api/v1/docs`
- OpenAPI JSON: `GET /api/v1/openapi.json`

### 3. Frontend setup
```bash
cd frontend
npm i
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## Testing

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm run lint
npm run test
npm run build
```

## CI/CD Deployment (GitHub Actions -> EC2)

- Workflow file: `.github/workflows/CI.yml`
- Trigger:
  - `push` to `main` when files change under `frontend/**`, `backend/**`, workflow file, or deploy script
  - `pull_request` to `main` for CI checks
- Jobs:
  - Frontend checks (`lint`, `test:ci`, `build`)
  - Backend checks (`npm run check`, `npm test`)
  - EC2 deploy job (runs only on push to `main`)

### Required GitHub configuration

- Secret:
  - `EC2_SSH_KEY`
- Variables (or secrets as fallback in workflow):
  - `EC2_HOST`
  - `EC2_USER`
  - `EC2_PORT`
  - `EC2_APP_DIR` (absolute app path on EC2; defaults handled by script)

### Deploy script

- Path: `scripts/deploy.sh`
- Responsibilities:
  - Pull latest `main`
  - Install backend deps (`npm ci --omit=dev`)
  - Install frontend deps + build
  - Restart/start PM2 backend and frontend processes
  - Save PM2 state

## Deployment Link
- Frontend: _TBD_
- Backend: _TBD_
