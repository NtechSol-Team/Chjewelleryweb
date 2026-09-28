import "server-only";
import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getSettings } from "@/lib/settings";

const { clients, products, collections, productViews, activity, sessions, shortlist, clientCollections, clientProducts, productMedia, consultations } = schema;

export const clientName = sql<string>`concat_ws(' ', ${clients.salutation}, ${clients.firstName}, ${clients.lastName})`;

/** Sessions that are still live: not revoked, not expired, not idle. */
async function liveSessionFilter() {
  const { session } = await getSettings();
  return and(
    isNull(sessions.revokedAt),
    gte(sessions.expiresAt, sql`now()`),
    gte(sessions.lastSeenAt, sql`now() - make_interval(mins => ${session.idleMinutes})`),
  )!;
}

export async function dashboardStats() {
  const live = await liveSessionFilter();
  const [[c], [ac], [p], [v], [tv], [s], [sh], [cons]] = await Promise.all([
    db.select({ n: count() }).from(clients),
    db
      .select({ n: count() })
      .from(clients)
      .where(and(eq(clients.status, "active"), or(isNull(clients.accessEndsAt), gte(clients.accessEndsAt, sql`now()`)))),
    db.select({ n: count() }).from(products).where(eq(products.status, "published")),
    db.select({ n: count(), ms: sql<number>`coalesce(sum(${productViews.durationMs}),0)::bigint` }).from(productViews),
    db.select({ n: count() }).from(productViews).where(gte(productViews.startedAt, sql`date_trunc('day', now())`)),
    db.select({ n: count() }).from(sessions).where(and(eq(sessions.subjectType, "client"), live)),
    db.select({ n: count() }).from(shortlist),
    db.select({ n: count() }).from(consultations).where(eq(consultations.status, "new")),
  ]);
  return {
    totalClients: c.n,
    activeClients: ac.n,
    products: p.n,
    totalViews: v.n,
    totalViewMs: Number(v.ms),
    todayViews: tv.n,
    activeSessions: s.n,
    shortlisted: sh.n,
    newConsultations: cons.n,
  };
}

export async function viewsByDay(days = 30, clientId?: string) {
  const rows = await db.execute<{ day: string; views: number; ms: number }>(sql`
    select to_char(d.day, 'YYYY-MM-DD') as day,
           coalesce(count(v.id), 0)::int as views,
           coalesce(sum(v.duration_ms), 0)::bigint as ms
    from generate_series(date_trunc('day', now()) - make_interval(days => ${days - 1}), date_trunc('day', now()), interval '1 day') as d(day)
    left join product_views v on date_trunc('day', v.started_at) = d.day
      ${clientId ? sql`and v.client_id = ${clientId}` : sql``}
    group by d.day order by d.day`);
  return rows.map((r) => ({ day: r.day, views: Number(r.views), ms: Number(r.ms) }));
}

export async function topProducts(limit = 8, sinceDays = 30) {
  return db
    .select({
      id: products.id,
      code: products.code,
      name: products.name,
      category: products.category,
      views: count(productViews.id),
      ms: sql<number>`coalesce(sum(${productViews.durationMs}),0)::bigint`.mapWith(Number),
      viewers: sql<number>`count(distinct ${productViews.clientId})`.mapWith(Number),
    })
    .from(productViews)
    .innerJoin(products, eq(products.id, productViews.productId))
    .where(gte(productViews.startedAt, sql`now() - make_interval(days => ${sinceDays})`))
    .groupBy(products.id)
    .orderBy(desc(count(productViews.id)))
    .limit(limit);
}

export async function clientEngagement(sinceDays = 30) {
  return db
    .select({
      id: clients.id,
      name: clientName,
      views: count(productViews.id),
      ms: sql<number>`coalesce(sum(${productViews.durationMs}),0)::bigint`.mapWith(Number),
      pieces: sql<number>`count(distinct ${productViews.productId})`.mapWith(Number),
    })
    .from(productViews)
    .innerJoin(clients, eq(clients.id, productViews.clientId))
    .where(gte(productViews.startedAt, sql`now() - make_interval(days => ${sinceDays})`))
    .groupBy(clients.id)
    .orderBy(desc(count(productViews.id)));
}

export async function durationByCategory(sinceDays = 30) {
  const rows = await db
    .select({
      category: products.category,
      avgMs: sql<number>`avg(${productViews.durationMs})::bigint`.mapWith(Number),
      views: count(productViews.id),
    })
    .from(productViews)
    .innerJoin(products, eq(products.id, productViews.productId))
    .where(gte(productViews.startedAt, sql`now() - make_interval(days => ${sinceDays})`))
    .groupBy(products.category)
    .orderBy(desc(sql`avg(${productViews.durationMs})`));
  return rows;
}

export type ActivityRow = {
  id: string;
  type: string;
  detail: string | null;
  createdAt: Date;
  actorType: "client" | "admin";
  clientId: string | null;
  clientName: string | null;
  productCode: string | null;
  productName: string | null;
};

export async function recentActivity(opts: { limit?: number; clientId?: string; types?: string[]; sinceDays?: number } = {}): Promise<ActivityRow[]> {
  const where: SQL[] = [];
  if (opts.clientId) where.push(eq(activity.clientId, opts.clientId));
  if (opts.types?.length) where.push(inArray(activity.type, opts.types));
  if (opts.sinceDays) where.push(gte(activity.createdAt, sql`now() - make_interval(days => ${opts.sinceDays})`));
  return db
    .select({
      id: activity.id,
      type: activity.type,
      detail: activity.detail,
      createdAt: activity.createdAt,
      actorType: activity.actorType,
      clientId: activity.clientId,
      clientName: sql<string | null>`case when ${clients.id} is null then null else ${clientName} end`,
      productCode: products.code,
      productName: products.name,
    })
    .from(activity)
    .leftJoin(clients, eq(clients.id, activity.clientId))
    .leftJoin(products, eq(products.id, activity.productId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(activity.createdAt))
    .limit(opts.limit ?? 50);
}

/** WHO viewed WHAT, WHEN, HOW OFTEN and for HOW LONG. */
export async function viewingTable(f: { clientId?: string; productQ?: string; collection?: string; sinceDays?: number }) {
  const where: SQL[] = [gte(productViews.startedAt, sql`now() - make_interval(days => ${f.sinceDays ?? 30})`)];
  if (f.clientId) where.push(eq(productViews.clientId, f.clientId));
  if (f.collection) where.push(eq(collections.slug, f.collection));
  if (f.productQ) where.push(or(ilike(products.code, `%${f.productQ}%`), ilike(products.name, `%${f.productQ}%`))!);

  return db
    .select({
      clientId: clients.id,
      clientName,
      productId: products.id,
      code: products.code,
      name: products.name,
      collection: collections.name,
      views: count(productViews.id),
      ms: sql<number>`coalesce(sum(${productViews.durationMs}),0)::bigint`.mapWith(Number),
      lastViewed: sql<Date>`max(${productViews.startedAt})`.mapWith((v) => new Date(v)),
      shortlisted: sql<boolean>`exists(select 1 from shortlist s where s.client_id = ${clients.id} and s.product_id = ${products.id})`,
      discussed: sql<boolean>`exists(select 1 from consultations c where c.client_id = ${clients.id} and c.product_ids ? ${products.id}::text)`,
    })
    .from(productViews)
    .innerJoin(clients, eq(clients.id, productViews.clientId))
    .innerJoin(products, eq(products.id, productViews.productId))
    .leftJoin(collections, eq(collections.id, products.collectionId))
    .where(and(...where))
    .groupBy(clients.id, products.id, collections.name)
    .orderBy(desc(sql`max(${productViews.startedAt})`))
    .limit(300);
}

export async function listClientsAdmin(q?: string) {
  const live = await liveSessionFilter();
  const rows = await db
    .select({
      c: clients,
      collections: sql<number>`(select count(*) from client_collections cc where cc.client_id = "clients"."id")`.mapWith(Number),
      products: sql<number>`(select count(*) from client_products cp where cp.client_id = "clients"."id")`.mapWith(Number),
    })
    .from(clients)
    .where(
      q
        ? or(ilike(clients.firstName, `%${q}%`), ilike(clients.lastName, `%${q}%`), ilike(clients.company, `%${q}%`), ilike(clients.username, `%${q}%`))
        : undefined,
    )
    .orderBy(desc(clients.lastLoginAt));

  const liveRows = await db
    .select({ subjectId: sessions.subjectId, lastSeenAt: sessions.lastSeenAt })
    .from(sessions)
    .where(and(eq(sessions.subjectType, "client"), live));
  const liveSet = new Map(liveRows.map((r) => [r.subjectId, r.lastSeenAt]));
  return rows.map((r) => ({ ...r.c, collectionCount: r.collections, productCount: r.products, online: liveSet.has(r.c.id) }));
}

export async function clientCatalogueSummary(clientId: string) {
  const [cols, prods, total] = await Promise.all([
    db
      .select({ id: collections.id, name: collections.name, slug: collections.slug })
      .from(clientCollections)
      .innerJoin(collections, eq(collections.id, clientCollections.collectionId))
      .where(eq(clientCollections.clientId, clientId))
      .orderBy(asc(collections.sortOrder)),
    db
      .select({ id: products.id, code: products.code, name: products.name })
      .from(clientProducts)
      .innerJoin(products, eq(products.id, clientProducts.productId))
      .where(eq(clientProducts.clientId, clientId))
      .orderBy(asc(products.code)),
    db.execute<{ n: number }>(sql`
      select count(distinct p.id)::int as n from products p
      where p.status = 'published' and (
        p.collection_id in (select collection_id from client_collections where client_id = ${clientId})
        or p.id in (select product_id from client_products where client_id = ${clientId}))`),
  ]);
  return { collections: cols, products: prods, totalPieces: Number(total[0]?.n ?? 0) };
}

export async function sessionsAdmin() {
  const live = await liveSessionFilter();
  const base = db
    .select({
      s: sessions,
      clientName: sql<string | null>`(select concat_ws(' ', c.salutation, c.first_name, c.last_name) from clients c where c.id = "sessions"."subject_id")`,
      adminName: sql<string | null>`(select a.name from admins a where a.id = "sessions"."subject_id")`,
    })
    .from(sessions);
  const [active, ended] = await Promise.all([
    base.where(live).orderBy(desc(sessions.lastSeenAt)),
    db
      .select({
        s: sessions,
        clientName: sql<string | null>`(select concat_ws(' ', c.salutation, c.first_name, c.last_name) from clients c where c.id = "sessions"."subject_id")`,
        adminName: sql<string | null>`(select a.name from admins a where a.id = "sessions"."subject_id")`,
      })
      .from(sessions)
      .where(sql`not (${live})`)
      .orderBy(desc(sessions.lastSeenAt))
      .limit(40),
  ]);
  return { active, ended };
}

export async function productsAdmin(f: { q?: string; category?: string; status?: string; collection?: string } = {}) {
  const where: SQL[] = [];
  if (f.q) where.push(or(ilike(products.code, `%${f.q}%`), ilike(products.name, `%${f.q}%`))!);
  if (f.category) where.push(eq(products.category, f.category));
  if (f.status) where.push(eq(products.status, f.status as "published"));
  if (f.collection) where.push(eq(collections.slug, f.collection));
  return db
    .select({
      p: products,
      collection: collections.name,
      collectionSlug: collections.slug,
      cover: sql<string | null>`(select m.url from product_media m where m.product_id = ${products.id} and m.kind = 'image' order by m.sort_order limit 1)`,
      images: sql<number>`(select count(*) from product_media m where m.product_id = ${products.id} and m.kind = 'image')`.mapWith(Number),
      hasVideo: sql<boolean>`exists(select 1 from product_media m where m.product_id = ${products.id} and m.kind = 'video')`,
      hasSpin: sql<boolean>`exists(select 1 from product_media m where m.product_id = ${products.id} and m.kind = 'spin')`,
      views: sql<number>`(select count(*) from product_views v where v.product_id = ${products.id})`.mapWith(Number),
      clients: sql<number>`(select count(distinct c.id) from clients c where exists(select 1 from client_collections cc where cc.client_id = c.id and cc.collection_id = ${products.collectionId}) or exists(select 1 from client_products cp where cp.client_id = c.id and cp.product_id = ${products.id}))`.mapWith(Number),
    })
    .from(products)
    .leftJoin(collections, eq(collections.id, products.collectionId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(products.code));
}

export async function collectionsAdmin() {
  return db
    .select({
      c: collections,
      pieces: sql<number>`(select count(*) from products p where p.collection_id = "collections"."id")`.mapWith(Number),
      clients: sql<number>`(select count(*) from client_collections cc where cc.collection_id = "collections"."id")`.mapWith(Number),
    })
    .from(collections)
    .orderBy(asc(collections.sortOrder));
}

export async function mediaLibrary(kind?: string) {
  return db
    .select({ m: productMedia, code: products.code, name: products.name, productId: products.id })
    .from(productMedia)
    .innerJoin(products, eq(products.id, productMedia.productId))
    .where(kind ? eq(productMedia.kind, kind as "image") : undefined)
    .orderBy(asc(products.code), asc(productMedia.sortOrder));
}

export async function consultationsAdmin(limit = 10) {
  return db
    .select({ c: consultations, clientName })
    .from(consultations)
    .innerJoin(clients, eq(clients.id, consultations.clientId))
    .orderBy(desc(consultations.createdAt))
    .limit(limit);
}
