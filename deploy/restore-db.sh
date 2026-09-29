#!/usr/bin/env bash
# Restores a local database dump into the server's PostgreSQL database.
# Run on the server, after provision.sh, as root:
#
#   scp <dump>.dump root@143.110.248.9:/root/chjewellery.dump
#   ssh root@143.110.248.9 'bash /var/www/chjewellery/deploy/restore-db.sh /root/chjewellery.dump'
#
# The dump is created locally with:
#   pg_dump -Fc --no-owner --no-privileges ch_jewels > chjewellery.dump
set -euo pipefail

DUMP_FILE="${1:?Usage: restore-db.sh <path-to-dump-file>}"
DB_NAME="chjewellery"
DB_USER="chjewellery"

if [ ! -f "$DUMP_FILE" ]; then
  echo "No such file: $DUMP_FILE" >&2
  exit 1
fi

echo "→ Restoring $DUMP_FILE into ${DB_NAME} (existing data in this database will be replaced)"
sudo -u postgres pg_restore --clean --if-exists --no-owner --no-privileges \
  --role="${DB_USER}" -d "${DB_NAME}" "$DUMP_FILE"

echo "✓ Restored. Local admin accounts and sessions from the dump come along too —"
echo "  sign in with the existing demo admin, or run 'npm run db:bootstrap-admin' to add another."
