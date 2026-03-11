#!/usr/bin/env bash
set -Eeuo pipefail

BRANCH="main"
APP_DIR="/home/ubuntu/Collaborating-Trip-Planning"

BACKEND_PM2_NAME="${BACKEND_PM2_NAME:-backend}"

usage() {
  cat <<'EOF'
Usage:
  deploy-ec2.sh [--branch <branch>] [--repo-url <url>] [--app-dir <dir>]

Optional environment variables:
  BACKEND_PM2_NAME   PM2 process name for backend (default: backend)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch)
      BRANCH="${2:-}"
      shift 2
      ;;
    --repo-url)
      REPO_URL="${2:-}"
      shift 2
      ;;
    --app-dir)
      APP_DIR="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

command -v git >/dev/null 2>&1 || { echo "git is required"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "node is required"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required"; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo "pm2 is required"; exit 1; }

if [[ -z "${APP_DIR}" ]]; then
  for candidate in \
    "$PWD" \
    "$HOME/Collaborating-Trip-Planning" \
    "$HOME/Collaborating Trip Planning"
  do
    if [[ -d "${candidate}/frontend" && -d "${candidate}/backend" ]]; then
      APP_DIR="${candidate}"
      break
    fi
  done
fi

if [[ -z "${APP_DIR}" ]]; then
  APP_DIR="$HOME/Collaborating-Trip-Planning"
fi

echo "Deploy branch: ${BRANCH}"
echo "App directory: ${APP_DIR}"

if [[ -d "${APP_DIR}/.git" ]]; then
  cd "${APP_DIR}"
else
  if [[ -z "${REPO_URL}" ]]; then
    echo "Repository URL is required for first deployment. Pass --repo-url." >&2
    exit 1
  fi

  mkdir -p "${APP_DIR}"
  git clone "${REPO_URL}" "${APP_DIR}"
  cd "${APP_DIR}"
fi

sync_repository() {
  local timestamp=""
  local stash_name=""

  git fetch origin "${BRANCH}"

  if [[ -n "$(git status --porcelain)" ]]; then
    timestamp="$(date +%Y%m%d-%H%M%S)"
    stash_name="deploy-auto-stash-${timestamp}"
    echo "Detected local changes in EC2 working tree. Creating stash: ${stash_name}"
    git stash push --include-untracked --message "${stash_name}" >/dev/null || true
  fi

  if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
    git checkout -f "${BRANCH}"
  else
    git checkout -b "${BRANCH}" "origin/${BRANCH}"
  fi

  # Force-sync to remote branch to avoid merge failures in CI deploy.
  git reset --hard "origin/${BRANCH}"
}

sync_repository

echo "Installing backend dependencies..."
cd backend
npm ci --omit=dev
cd ..

echo "Installing frontend dependencies and building..."
cd frontend
npm ci
npm run build
cd ..

echo "Restarting backend PM2 process: ${BACKEND_PM2_NAME}"
if pm2 describe "${BACKEND_PM2_NAME}" >/dev/null 2>&1; then
  pm2 restart "${BACKEND_PM2_NAME}" --update-env
else
  pm2 start backend/src/server.js --name "${BACKEND_PM2_NAME}"
fi

pm2 save
pm2 status

echo "Deployment completed successfully."
