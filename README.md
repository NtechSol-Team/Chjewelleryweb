# CH Jewels — Private Showroom

A private digital showroom for selected CH Jewels clients, plus an internal console for the team.
Clients can view, explore, shortlist and discuss pieces. Nothing is sold here: there is no cart, checkout or pricing.

- **Client showroom**: editorial, light-first and immersive. Each client sees only the catalogue curated for them.
- **Atelier Console** (`/admin`): efficient and data-first. It covers clients, products, catalogue assignment, media, activity, engagement analytics, sessions and settings.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, GSAP, Framer Motion, Lottie, Lucide, Drizzle ORM and PostgreSQL.

---

## Getting started

Requirements: Node 20+ and a local PostgreSQL (tested with Homebrew `postgresql@18`).

```bash
# 1. Start Postgres if it isn't running
pg_ctl -D /opt/homebrew/var/postgresql@18 start      # or: brew services start postgresql@18

# 2. Create the database and configure the connection
createdb ch_jewels
cp .env.example .env.local                            # then set DATABASE_URL

# 3. Install, migrate, seed, run
npm install
npm run db:setup                                      # migrate + seed demo data
npm run dev                                           # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run db:generate` | Generate a SQL migration from `lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations in `drizzle/` |
| `npm run db:seed` | **Reset** all tables and load the demo showroom |
| `npm run db:studio` | Browse the database in Drizzle Studio |
| `npm run typecheck` / `npm run lint` / `npm run build` | Quality gates |

## Deploy

This app is deployed to a self-hosted droplet at **143.110.248.9** (systemd + nginx + a local PostgreSQL database) — see **[deploy/README.md](deploy/README.md)** for provisioning, restoring the database, redeploying and operating it. There is no PaaS involved; `deploy/provision.sh` sets the server up from scratch and `deploy/deploy.sh` redeploys on each change.

### Demo accounts

All client passwords are `Private#2026`. The staff password is `Atelier#2026`.

| Sign in at | Username | Scenario |
|---|---|---|
| `/login` | `arjun.mehta` | 3 collections (Signature Rings, Private Selection, Diamond Collection) |
| `/login` | `elena.rossi` | 1 collection (Timeless Necklaces) |
| `/login` | `khalid.am` | 8 individually selected pieces, no whole collections |
| `/login` | `aanya.shah` | Nothing assigned yet, so the showroom shows its empty states |
| `/login` | `sophia.laurent` | Account disabled |
| `/login` | `rohan.kapoor` | Access window expired |
| `/admin/login` | `admin@chjewels.com` | Staff (Director, Private Clients) |

---

## Structure

```
app/
  (auth)/login                 Client sign-in ("private vault" entrance)
  (private)/                   Every route here requires a valid client session
    welcome                    Personal welcome and transition into the showroom
    (showroom)/                Header, footer, page-transition template
      catalogue                Editorial home
      collections, collections/[slug]
      jewellery, new-arrivals  Catalogue with filters, search and sort
      product/[code]           Piece page: gallery, lightbox, 360°, film
      shortlist                Shortlist and "Discuss selected pieces"
      profile                  Access, session, advisor, privacy
  access                       Restriction and error states (?reason=…)
  admin/login, admin/(panel)/… Atelier Console
  api/session                  Heartbeat: revocation, timeout, disablement
  api/views                    Viewing-duration telemetry
  api/media/[file]             Entitlement-checked media delivery
  api/admin/media              Private media upload (images, film, 360° frames)
  api/admin/analytics.csv      Analytics export
components/{ui,catalogue,product,showroom,animations,admin}
lib/
  db/schema.ts                 Drizzle schema (13 tables)
  auth/session.ts              Sessions, single-session, idle timeout, access windows
  catalogue.ts                 Client-scoped data access (the only way pieces are read)
  admin/queries.ts             Dashboard and analytics aggregates
  actions/                     Server actions (client auth, shortlist, admin)
  taxonomy.ts                  Category codes → labels (RING, ER, PS, BROCH, MS, LB, LK, NK)
proxy.ts                       Optimistic route gate and security headers
scripts/seed*.ts               Demo data
```

## Security model

- **Client-scoped catalogue.** Every client-facing query goes through one predicate in `lib/catalogue.ts`. A client can see a piece only if it is published and either sits in a published collection assigned to them or is assigned to them individually. That predicate covers pages, search, shortlist, consultation requests and media. A piece that is unassigned looks the same to the client as one that does not exist.
- **Sessions** are random 256-bit tokens in httpOnly cookies. Only their SHA-256 hash is stored in Postgres. Authorisation happens on every render and API call:
  - **Single active session:** signing in revokes the client's other sessions.
  - **Idle timeout** (default 30 min, server-enforced). A tab that is open but idle does not keep the session alive. A warning appears 2 minutes before it closes.
  - **Maximum session length** (default 12 h).
  - **Staff can end a session** or **disable an account**. The open tab finds out within one heartbeat (60 s), or immediately on focus or navigation.
  - **Access windows** use optional start and end dates.
- **Media.** Uploads go to `storage/uploads`, outside `public/`. They are served only by `/api/media/[file]`, which checks the viewer's entitlement to the piece. Types and sizes are validated, and SVG is refused.
- **Deterrence, not prevention.** The showroom uses a traceable watermark (client name and session reference), a veil when the tab or window loses focus, and disables drag and right-click on media. **None of this can stop screenshots or photos of the screen**, and the UI says so honestly.
- Sign-in attempts are throttled (in-process; use Redis in production). Password checks run in constant time for unknown users. Responses send `noindex`, `X-Frame-Options: DENY` and `Cache-Control: private, no-store`.

## Design system

| Token | Value | Use |
|---|---|---|
| `ivory` | `#F7F4EE` | Page background |
| `pearl` / `cream` | `#FBF9F5` / `#EFE9DD` | Raised surfaces, image placeholders |
| `champagne` | `#C6A15B` | Hairlines, focus rings, accents. Never used for small text |
| `gold-deep` | `#8A6B2E` | Small gold text (meets AA contrast on ivory) |
| `charcoal` / `ink` | `#1D1C1A` / `#0C0C0B` | Text, primary buttons, dark bands |
| `muted` / `line` | `#6F6A60` / `#DDD7CA` | Secondary text, hairlines |

- **Type:** Cormorant Garamond for display, Manrope for the showroom UI, Inter for the console. Small uppercase labels use 0.28em tracking (`.eyebrow`).
- **Motion:**
  - GSAP handles hero reveals, masked image reveals, parallax, the pinned horizontal rail and text clipping.
  - Framer Motion handles drawers, dialogs, the 700 ms page transition and shortlist feedback.
  - Lottie is used only for success, security, loading and empty states. Those line animations are generated in `lib/lottie-data.ts`.
  - All motion respects `prefers-reduced-motion`.
- **Console charts:** single-series gold `#A8761C`, with blue `#2E6AA8` in reserve. Both were validated for colour-vision deficiency and contrast on white. Each chart has a "View as table" fallback.

## Before production

- **Replace the demo content.** Photography comes from Unsplash and films from Mixkit, both free-licence placeholders. Editorial copy, product specifications and brand claims are placeholders to be confirmed by CH Jewels. The seeded 360° views sweep a crop across a still image. Real 360° views are 24–72 frame turntable sequences, uploaded as "360° frames".
- **Storage.** The server's own disk persists `storage/uploads` for this single instance — back it up along with the database. If the app ever needs to run on more than one instance, move uploads to private object storage (S3, R2 or GCS) behind `/api/media` or signed URLs.
- **Sign-in throttling.** Move it to Redis or Upstash.
- **Transactional email.** Add it for consultation requests and password resets.
- **Staff roles.** Add granular permissions if more than one team will use the console.
