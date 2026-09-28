/**
 * Seeds the local Postgres database with the CH Jewels demo showroom:
 * collections, products + media, clients with individual catalogues,
 * and ~30 days of realistic viewing history for the analytics screens.
 *
 *   npm run db:seed
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createHash, randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as schema from "../lib/db/schema";
import { photo } from "../lib/media";
import { COLLECTIONS, PRODUCTS, CLIENTS, VIDEO_SOURCES } from "./seed-data";

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema });

// Deterministic PRNG so the demo analytics are stable between reseeds.
let seed = 20260928;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
const between = (a: number, b: number) => a + rand() * (b - a);

const DAY = 86_400_000;
const now = Date.now();

function mediaFor(p: (typeof PRODUCTS)[number]) {
  const [x, y] = p.focus ?? [0.5, 0.5];
  const z = p.zoom ?? 1;
  const clamp = (v: number) => Math.min(0.9, Math.max(0.1, v));
  const rows: Omit<typeof schema.productMedia.$inferInsert, "productId">[] = [
    { kind: "image", url: photo(p.photo, { x, y, zoom: z }), alt: `${p.name} — full view`, sortOrder: 0 },
    { kind: "image", url: photo(p.photo, { x, y, zoom: 1.7 * z }), alt: `${p.name} — setting detail`, sortOrder: 1 },
    { kind: "image", url: photo(p.photo, { x: clamp(x + 0.06), y: clamp(y - 0.04), zoom: 2.6 * z }), alt: `${p.name} — stone macro`, sortOrder: 2 },
    { kind: "image", url: photo(p.photo, { x: clamp(x - 0.08 * (1 / z)), y, zoom: 1.3 * z, ratio: [1, 1] }), alt: `${p.name} — profile`, sortOrder: 3 },
  ];
  if (p.video) {
    const v = VIDEO_SOURCES[p.video];
    rows.push({ kind: "video", url: v.src, posterUrl: v.poster, alt: `${p.name} — film`, sortOrder: 4 });
  }
  if (p.spin) {
    // A 36-frame sequence. Production spins are shot on a turntable; the demo
    // sweeps a focal crop across the campaign still so the viewer is exercisable.
    const frames = Array.from({ length: 36 }, (_, i) => {
      const t = (i / 36) * Math.PI * 2;
      return photo(p.photo, { x: clamp(x + Math.sin(t) * 0.07), y: clamp(y + Math.cos(t) * 0.02), zoom: 1.25 * z, ratio: [1, 1] });
    });
    rows.push({ kind: "spin", url: frames[0], frames, alt: `${p.name} — 360° view`, sortOrder: 5 });
  }
  return rows;
}

async function main() {
  console.log("› Resetting tables");
  await db.execute(sql`TRUNCATE activity, product_views, shortlist, consultations, sessions, client_products,
    client_collections, product_media, products, collections, clients, admins, settings RESTART IDENTITY CASCADE`);

  console.log("› Admins");
  const adminHash = await bcrypt.hash("Atelier#2026", 10);
  const [admin] = await db
    .insert(schema.admins)
    .values([
      { email: "admin@chjewels.com", name: "Kavya Iyer", role: "Director, Private Clients", passwordHash: adminHash },
      { email: "rahul@chjewels.com", name: "Rahul Desai", role: "Client Advisor", passwordHash: adminHash },
    ])
    .returning();

  await db.insert(schema.settings).values([
    { key: "watermark", value: { enabled: true, opacity: 0.08 } },
    { key: "privacyBlur", value: { enabled: true } },
    { key: "session", value: { idleMinutes: 30, maxHours: 12, singleSession: true } },
    { key: "concierge", value: { phone: "+91 22 6600 1080", email: "private@chjewels.com", hours: "Mon–Sat, 10:00–19:00 IST" } },
  ]);

  console.log("› Collections");
  const cols = await db
    .insert(schema.collections)
    .values(
      COLLECTIONS.map((c, i) => ({
        slug: c.slug,
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        coverUrl: photo(c.cover),
        sortOrder: i + 1,
      })),
    )
    .returning();
  const colBySlug = new Map(cols.map((c) => [c.slug, c]));

  console.log(`› Products (${PRODUCTS.length})`);
  const prods = await db
    .insert(schema.products)
    .values(
      PRODUCTS.map((p, i) => ({
        code: p.code,
        name: p.name,
        category: p.category,
        gender: p.gender ?? "FEMALE",
        shape: p.shape ?? null,
        collectionId: colBySlug.get(p.collection)!.id,
        description: p.description,
        specifications: p.specs,
        isNew: p.isNew ?? false,
        createdAt: new Date(now - (p.isNew ? between(2, 14) : between(40, 400)) * DAY - i * 1000),
      })),
    )
    .returning();
  const prodByCode = new Map(prods.map((p) => [p.code, p]));

  await db.insert(schema.productMedia).values(
    PRODUCTS.flatMap((p) => mediaFor(p).map((m) => ({ ...m, productId: prodByCode.get(p.code)!.id }))),
  );

  console.log("› Clients & catalogue assignments");
  const clientHash = await bcrypt.hash("Private#2026", 10);
  const clientRows = await db
    .insert(schema.clients)
    .values(
      CLIENTS.map((c) => ({
        salutation: c.salutation,
        firstName: c.firstName,
        lastName: c.lastName,
        company: c.company,
        city: c.city,
        email: c.email,
        phone: c.phone,
        username: c.username,
        passwordHash: clientHash,
        status: c.status,
        advisor: c.advisor,
        accessStartsAt: new Date(now - 60 * DAY),
        accessEndsAt: new Date(now + c.accessEndsInDays * DAY),
        createdAt: new Date(now - 62 * DAY),
      })),
    )
    .returning();
  const clientByUser = new Map(clientRows.map((c) => [c.username, c]));

  for (const c of CLIENTS) {
    const row = clientByUser.get(c.username)!;
    if (c.collections.length)
      await db.insert(schema.clientCollections).values(
        c.collections.map((slug) => ({ clientId: row.id, collectionId: colBySlug.get(slug)!.id })),
      );
    if (c.products.length)
      await db.insert(schema.clientProducts).values(
        c.products.map((code) => ({ clientId: row.id, productId: prodByCode.get(code)!.id })),
      );
  }

  console.log("› Viewing history");
  const catalogueOf = (username: string) => {
    const c = CLIENTS.find((x) => x.username === username)!;
    const set = new Set(c.products);
    for (const p of PRODUCTS) if ((c.collections as readonly string[]).includes(p.collection)) set.add(p.code);
    return [...set].map((code) => prodByCode.get(code)!);
  };

  const views: (typeof schema.productViews.$inferInsert)[] = [];
  const events: (typeof schema.activity.$inferInsert)[] = [];
  const sessionRows: (typeof schema.sessions.$inferInsert)[] = [];
  const favourites = new Map<string, Set<string>>();
  const agents = [
    "Safari · iPad Pro",
    "Chrome · macOS",
    "Safari · iPhone 16 Pro",
    "Edge · Windows 11",
  ];

  const activityPlan: Record<string, { visits: number; lastVisitDaysAgo: number; windowDays: number }> = {
    "arjun.mehta": { visits: 14, lastVisitDaysAgo: 0, windowDays: 30 },
    "elena.rossi": { visits: 9, lastVisitDaysAgo: 0, windowDays: 30 },
    "khalid.am": { visits: 7, lastVisitDaysAgo: 1, windowDays: 21 },
    "sophia.laurent": { visits: 3, lastVisitDaysAgo: 18, windowDays: 30 },
    "rohan.kapoor": { visits: 4, lastVisitDaysAgo: 13, windowDays: 30 },
  };

  for (const [username, plan] of Object.entries(activityPlan)) {
    const c = clientByUser.get(username)!;
    const catalogue = catalogueOf(username);
    const fav = new Set<string>();
    favourites.set(c.id, fav);
    const device = pick(agents);
    let lastLogin = 0;
    for (let v = 0; v < plan.visits; v++) {
      const daysAgo =
        v === plan.visits - 1 ? plan.lastVisitDaysAgo : plan.lastVisitDaysAgo + between(0.5, plan.windowDays - plan.lastVisitDaysAgo);
      let t = now - daysAgo * DAY - between(0.2, 6) * 3_600_000;
      if (v === plan.visits - 1 && plan.lastVisitDaysAgo === 0) t = now - between(25, 70) * 60_000;
      const sessionId = randomUUID();
      const start = t;
      events.push({ actorType: "client", actorId: c.id, clientId: c.id, type: "login", detail: device, createdAt: new Date(t) });
      const n = Math.floor(between(3, 9));
      // Clients revisit favourites, so weight the first few pieces heavily.
      for (let i = 0; i < n; i++) {
        const product = rand() < 0.45 ? catalogue[Math.floor(rand() * Math.min(4, catalogue.length))] : pick(catalogue);
        t += between(20, 90) * 1000;
        const duration = Math.round(between(18, 260) * 1000);
        views.push({ id: randomUUID(), clientId: c.id, productId: product.id, sessionId, startedAt: new Date(t), lastPingAt: new Date(t + duration), durationMs: duration });
        events.push({ actorType: "client", actorId: c.id, clientId: c.id, productId: product.id, type: "view_product", detail: product.code, createdAt: new Date(t) });
        t += duration;
        if (rand() < 0.22 && !fav.has(product.id)) {
          fav.add(product.id);
          events.push({ actorType: "client", actorId: c.id, clientId: c.id, productId: product.id, type: "shortlist_add", detail: product.code, createdAt: new Date(t + 4000) });
        }
      }
      const isLive = v === plan.visits - 1 && plan.lastVisitDaysAgo === 0;
      if (!isLive)
        events.push({ actorType: "client", actorId: c.id, clientId: c.id, type: "logout", createdAt: new Date(t + 30_000) });
      sessionRows.push({
        id: sessionId,
        tokenHash: createHash("sha256").update(randomBytes(32)).digest("hex"),
        subjectType: "client",
        subjectId: c.id,
        userAgent: device,
        ip: pick(["103.21.58.14", "91.198.44.203", "5.195.12.80", "49.36.112.9"]),
        createdAt: new Date(start),
        lastSeenAt: new Date(isLive ? now - between(1, 9) * 60_000 : t),
        expiresAt: new Date(start + 12 * 3_600_000),
        revokedAt: isLive ? null : new Date(t + 30_000),
        revokedReason: isLive ? null : "logout",
      });
      lastLogin = Math.max(lastLogin, start);
    }
    await db.update(schema.clients).set({ lastLoginAt: new Date(lastLogin) }).where(sql`id = ${c.id}`);
  }

  // Sophia's account was disabled by an advisor after her last visit.
  const sophia = clientByUser.get("sophia.laurent")!;
  events.push({ actorType: "admin", actorId: admin.id, clientId: sophia.id, type: "account_disabled", detail: "Access paused at client's request", createdAt: new Date(now - 16 * DAY) });
  // Arjun requested a consultation a few days ago.
  const arjun = clientByUser.get("arjun.mehta")!;

  const chunk = <T,>(arr: T[], size: number) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
  for (const part of chunk(views, 500)) await db.insert(schema.productViews).values(part);
  for (const part of chunk(events, 500)) await db.insert(schema.activity).values(part);
  await db.insert(schema.sessions).values(sessionRows);

  const shortlistRows = [...favourites.entries()].flatMap(([clientId, set]) =>
    [...set].map((productId, i) => ({ clientId, productId, createdAt: new Date(now - (i + 1) * between(0.3, 3) * DAY) })),
  );
  if (shortlistRows.length) await db.insert(schema.shortlist).values(shortlistRows);

  const arjunFavs = [...(favourites.get(arjun.id) ?? [])].slice(0, 3);
  if (arjunFavs.length)
    await db.insert(schema.consultations).values({
      clientId: arjun.id,
      productIds: arjunFavs,
      preference: "Private appointment — Mumbai salon",
      message: "Would like to see the solitaires in person before our anniversary in November.",
      createdAt: new Date(now - 3 * DAY),
    });

  console.log(
    `✓ Seeded ${cols.length} collections, ${prods.length} products, ${clientRows.length} clients, ${views.length} views, ${events.length} events`,
  );
  await client.end();
}

main().catch(async (e) => {
  console.error(e);
  await client.end();
  process.exit(1);
});
