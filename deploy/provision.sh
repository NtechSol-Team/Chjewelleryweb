#!/usr/bin/env bash
# First-time server setup for CH Jewels ("chjewellery") on a plain Ubuntu/Debian droplet.
#
# Run as root on the target server (143.110.248.9):
#   scp deploy/provision.sh root@143.110.248.9:/root/
#   ssh root@143.110.248.9 'bash /root/provision.sh'
#
# This script installs Node, PostgreSQL and nginx, creates a dedicated
# system user and database, and installs (but does not yet start) the
# systemd service. It does NOT deploy application code — run deploy.sh
# (as the chjewellery user) afterwards, or restore from a dump first.
set -euo pipefail

APP_NAME="chjewellery"
APP_DIR="/var/www/${APP_NAME}"
DB_NAME="chjewellery"
DB_USER="chjewellery"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root (sudo bash provision.sh)" >&2
  exit 1
fi

echo "→ Updating apt and installing base packages"
apt-get update -y
apt-get install -y curl ca-certificates gnupg nginx ufw

echo "→ Installing Node.js 20"
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "→ Installing PostgreSQL 16"
if ! command -v psql >/dev/null; then
  apt-get install -y postgresql postgresql-contrib
fi
systemctl enable --now postgresql

echo "→ Creating system user '${APP_NAME}'"
id -u "${APP_NAME}" &>/dev/null || useradd --system --create-home --shell /usr/sbin/nologin "${APP_NAME}"
mkdir -p "${APP_DIR}/storage/uploads"
chown -R "${APP_NAME}:${APP_NAME}" "${APP_DIR}"

echo "→ Creating database and role (idempotent)"
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 24 | tr -d '/+=')}"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
SQL

echo "→ DB role '${DB_USER}' password: ${DB_PASSWORD}"
echo "  (save this — it is only printed once here; put it in ${APP_DIR}/.env.local as DATABASE_URL)"

echo "→ Installing nginx site"
cp "$(dirname "$0")/nginx.conf" /etc/nginx/sites-available/${APP_NAME}
ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/${APP_NAME}
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "→ Installing systemd unit (not started yet — app code isn't deployed)"
cp "$(dirname "$0")/chjewellery.service" /etc/systemd/system/${APP_NAME}.service
systemctl daemon-reload

echo "→ Firewall: allow SSH, HTTP, HTTPS"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

cat <<EOF

✓ Server provisioned.

Next steps:
  1. Copy the app code to ${APP_DIR} (see deploy/deploy.sh), or restore the
     database dump first (see deploy/restore-db.sh).
  2. Write ${APP_DIR}/.env.local with at least:
       DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}
       SESSION_IDLE_MINUTES=30
       SESSION_MAX_HOURS=12
       BOOTSTRAP_ADMIN_EMAIL=<real admin email>
       BOOTSTRAP_ADMIN_PASSWORD=<strong password, 16+ chars>
       BOOTSTRAP_ADMIN_NAME=CH Jewels Administrator
  3. Run deploy/deploy.sh to install dependencies, build, migrate and start.
EOF
