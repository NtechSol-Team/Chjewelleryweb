# Deploying chjewellery to a self-hosted server

This app is deployed to a plain Ubuntu/Debian droplet at **143.110.248.9** — no
platform-as-a-service. It runs as a systemd service (`chjewellery`) behind
nginx, with its own local PostgreSQL database.

There is no domain pointed at this IP yet, so it's served over plain HTTP.
Point a domain at 143.110.248.9 and see the note at the bottom to add HTTPS
with Let's Encrypt.

## One-time setup

From your machine, with SSH access to the server as root:

```bash
scp deploy/provision.sh deploy/nginx.conf deploy/chjewellery.service root@143.110.248.9:/root/
ssh root@143.110.248.9 'bash /root/provision.sh'
```

This installs Node 20, PostgreSQL, nginx and ufw; creates the `chjewellery`
system user, database and role; installs the nginx site and systemd unit
(not yet started); and prints the generated database password — copy it,
it is not shown again.

Then either **restore the existing local showroom data** or **start empty**:

### Option A — restore the local demo/showroom data

```bash
# On your machine: dump the local database
pg_dump -Fc --no-owner --no-privileges ch_jewels > chjewellery.dump

# Copy the app code and the dump to the server
rsync -a --exclude node_modules --exclude .next --exclude .git \
  ./ root@143.110.248.9:/var/www/chjewellery/
scp chjewellery.dump root@143.110.248.9:/root/

# On the server: restore, then write the real env file
ssh root@143.110.248.9
  chown -R chjewellery:chjewellery /var/www/chjewellery
  bash /var/www/chjewellery/deploy/restore-db.sh /root/chjewellery.dump
  nano /var/www/chjewellery/.env.local   # DATABASE_URL + BOOTSTRAP_ADMIN_*, see below
  bash /var/www/chjewellery/deploy/deploy.sh
```

Restoring the dump brings over collections, products, media metadata, client
accounts, shortlists, activity and settings — including the demo admin
account and the demo client passwords (`Private#2026`). **Change those
before inviting real clients** (Clients → ⋯ → Reset password in the console).

### Option B — start with an empty catalogue

```bash
rsync -a --exclude node_modules --exclude .next --exclude .git \
  ./ root@143.110.248.9:/var/www/chjewellery/
ssh root@143.110.248.9
  chown -R chjewellery:chjewellery /var/www/chjewellery
  nano /var/www/chjewellery/.env.local
  bash /var/www/chjewellery/deploy/deploy.sh
```

`deploy.sh` runs migrations against the empty database and
`db:bootstrap-admin` creates the first admin from `BOOTSTRAP_ADMIN_EMAIL` /
`BOOTSTRAP_ADMIN_PASSWORD`. Nothing else is seeded — no demo clients, no
products — so the console starts with real, empty tables.

### `.env.local` on the server

```bash
DATABASE_URL=postgres://chjewellery:<password-from-provision.sh>@localhost:5432/chjewellery
SESSION_IDLE_MINUTES=30
SESSION_MAX_HOURS=12
BOOTSTRAP_ADMIN_EMAIL=<a real email you control>
BOOTSTRAP_ADMIN_PASSWORD=<strong password, 16+ characters>
BOOTSTRAP_ADMIN_NAME=CH Jewels Administrator
```

## Redeploying after a change

```bash
ssh root@143.110.248.9 'bash /var/www/chjewellery/deploy/deploy.sh'
```

Pulls the latest `main`, reinstalls dependencies, rebuilds, applies any new
migrations, and restarts the service. `storage/uploads` is untouched — it
lives on the server's own disk and is not part of the deploy or the git repo.

## Operating

```bash
systemctl status chjewellery         # is it running
journalctl -u chjewellery -f         # tail logs
systemctl restart chjewellery
```

## Adding HTTPS once a domain points here

```bash
apt-get install -y certbot python3-certbot-nginx
# Edit /etc/nginx/sites-available/chjewellery: server_name your-domain.com;
certbot --nginx -d your-domain.com
```

## What's different from the earlier Render setup

- One persistent server and disk instead of an ephemeral platform instance —
  `storage/uploads` survives restarts and deploys.
- The database is regular PostgreSQL on the same box, not a managed add-on;
  back it up yourself (`pg_dump` on a cron job, or an off-box copy).
- Nothing here builds automatically on push — `deploy.sh` is the deploy step,
  run by hand or wired into CI later.
