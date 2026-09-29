#!/usr/bin/env bash
# Deploys (or redeploys) the application code at /var/www/chjewellery.
# Run on the server, as root or with sudo (it drops to the chjewellery user
# for the build itself):
#
#   ssh root@143.110.248.9 'bash /var/www/chjewellery/deploy/deploy.sh'
#
# Prerequisites: provision.sh has run, and /var/www/chjewellery/.env.local
# exists with DATABASE_URL and the BOOTSTRAP_ADMIN_* values.
set -euo pipefail

APP_NAME="chjewellery"
APP_DIR="/var/www/${APP_NAME}"
REPO_URL="${REPO_URL:-https://github.com/NtechSol-Team/Chjewelleryweb.git}"
BRANCH="${BRANCH:-main}"

if [ ! -f "${APP_DIR}/.env.local" ]; then
  echo "Missing ${APP_DIR}/.env.local — create it before deploying (see provision.sh output)." >&2
  exit 1
fi

if [ -d "${APP_DIR}/.git" ]; then
  echo "→ Pulling latest ${BRANCH}"
  sudo -u ${APP_NAME} git -C "${APP_DIR}" fetch origin "${BRANCH}"
  sudo -u ${APP_NAME} git -C "${APP_DIR}" reset --hard "origin/${BRANCH}"
else
  echo "→ Cloning ${REPO_URL} (${BRANCH})"
  sudo -u ${APP_NAME} git clone --branch "${BRANCH}" "${REPO_URL}" "${APP_DIR}.new"
  rsync -a --exclude .git "${APP_DIR}.new/" "${APP_DIR}/"
  rm -rf "${APP_DIR}.new"
  chown -R ${APP_NAME}:${APP_NAME} "${APP_DIR}"
fi

echo "→ Installing dependencies"
sudo -u ${APP_NAME} bash -c "cd ${APP_DIR} && npm ci"

echo "→ Building"
sudo -u ${APP_NAME} bash -c "cd ${APP_DIR} && npm run build"

echo "→ Applying database migrations"
sudo -u ${APP_NAME} bash -c "cd ${APP_DIR} && npm run db:migrate"

echo "→ Ensuring an admin account exists"
sudo -u ${APP_NAME} bash -c "cd ${APP_DIR} && npm run db:bootstrap-admin"

echo "→ Restarting service"
systemctl enable --now ${APP_NAME}
systemctl restart ${APP_NAME}
systemctl status ${APP_NAME} --no-pager -l | head -15

echo "✓ Deployed. http://143.110.248.9/"
