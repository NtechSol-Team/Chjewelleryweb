import "server-only";
import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { CATEGORIES } from "@/lib/taxonomy";

const { products, productMedia, collections, clientCollections, clientProducts, shortlist } = schema;

export type PieceCard = {
  id: string;
  code: string;
  name: string;
  category: string;
  gender: string;
  shape: string | null;
  isNew: boolean;
  createdAt: Date;
  collection: { slug: string; name: string } | null;
  image: string | null;
  imageAlt: string;
  hasVideo: boolean;
  hasSpin: boolean;
};

export type MediaItem = {
  id: string;
  kind: "image" | "video" | "spin";
  url: string;
  posterUrl: string | null;
  frames: string[] | null;
  alt: string | null;
};

export type PieceDetail = PieceCard & {
  description: string | null;
  specifications: { label: string; value: string }[];
  media: MediaItem[];
};

export type CatalogueFilters = {
  category?: string[];
  gender?: string[];
  shape?: string[];
  collection?: string[];
  q?: string;
  sort?: "curated" | "new" | "code";
  onlyNew?: boolean;
};

/**
 * The single source of truth for what a client may see: published pieces in
 * their assigned collections, plus pieces assigned to them individually.
 * Every client-facing query goes through this predicate.
 */
function accessibleTo(clientId: string): SQL {
  return and(
    eq(products.status, "published"),
    or(
      // Whole collections — only while the collection itself is published.
      inArray(
        products.collectionId,
        db
          .select({ id: clientCollections.collectionId })
          .from(clientCollections)
          .innerJoin(collections, eq(collections.id, clientCollections.collectionId))
          .where(and(eq(clientCollections.clientId, clientId), eq(collections.isPublished, true))),
      ),
      inArray(
        products.id,
        db.select({ id: clientProducts.productId }).from(clientProducts).where(eq(clientProducts.clientId, clientId)),
      ),
    ),
  )!;
}

async function hydrate(rows: { p: typeof products.$inferSelect; c: typeof collections.$inferSelect | null }[]): Promise<PieceCard[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.p.id);
  const media = await db
    .select({ productId: productMedia.productId, kind: productMedia.kind, url: productMedia.url, alt: productMedia.alt, sortOrder: productMedia.sortOrder })
    .from(productMedia)
    .where(inArray(productMedia.productId, ids))
    .orderBy(asc(productMedia.sortOrder));

  const byProduct = new Map<string, typeof media>();
  for (const m of media) byProduct.set(m.productId, [...(byProduct.get(m.productId) ?? []), m]);

  return rows.map(({ p, c }) => {
    const m = byProduct.get(p.id) ?? [];
    const cover = m.find((x) => x.kind === "image");
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      category: p.category,
      gender: p.gender,
      shape: p.shape,
      isNew: p.isNew,
      createdAt: p.createdAt,
      collection: c ? { slug: c.slug, name: c.name } : null,
      image: cover?.url ?? null,
      imageAlt: cover?.alt ?? p.name,
      hasVideo: m.some((x) => x.kind === "video"),
      hasSpin: m.some((x) => x.kind === "spin"),
    };
  });
}

export async function listPieces(clientId: string, f: CatalogueFilters = {}) {
  const where: SQL[] = [accessibleTo(clientId)];
  if (f.category?.length) where.push(inArray(products.category, f.category));
  if (f.gender?.length) where.push(inArray(products.gender, f.gender));
  if (f.shape?.length) where.push(inArray(products.shape, f.shape));
  if (f.onlyNew) where.push(eq(products.isNew, true));
  if (f.collection?.length) where.push(inArray(collections.slug, f.collection));
  if (f.q?.trim()) {
    const q = f.q.trim();
    const cats = CATEGORIES.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())).map((c) => c.code);
    const like = `%${q.replace(/[%_]/g, "")}%`;
    where.push(
      or(
        ilike(products.code, like),
        ilike(products.name, like),
        ilike(products.description, like),
        ilike(collections.name, like),
        ...(cats.length ? [inArray(products.category, cats)] : []),
      )!,
    );
  }

  const order =
    f.sort === "new"
      ? [desc(products.createdAt)]
      : f.sort === "code"
        ? [asc(products.code)]
        : [asc(collections.sortOrder), desc(products.isNew), asc(products.code)];

  const rows = await db
    .select({ p: products, c: collections })
    .from(products)
    .leftJoin(collections, eq(products.collectionId, collections.id))
    .where(and(...where))
    .orderBy(...order);
  return hydrate(rows);
}

export async function getPiece(clientId: string, code: string): Promise<PieceDetail | null> {
  const [row] = await db
    .select({ p: products, c: collections })
    .from(products)
    .leftJoin(collections, eq(products.collectionId, collections.id))
    .where(and(eq(products.code, code), accessibleTo(clientId)))
    .limit(1);
  if (!row) return null;
  const [card] = await hydrate([row]);
  const media = await db
    .select()
    .from(productMedia)
    .where(eq(productMedia.productId, row.p.id))
    .orderBy(asc(productMedia.sortOrder));
  return {
    ...card,
    description: row.p.description,
    specifications: row.p.specifications,
    media: media.map((m) => ({ id: m.id, kind: m.kind, url: m.url, posterUrl: m.posterUrl, frames: m.frames, alt: m.alt })),
  };
}

/** Lightweight access check used by API routes and actions. */
export async function canAccessProduct(clientId: string, productId: string) {
  const [row] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), accessibleTo(clientId)))
    .limit(1);
  return !!row;
}

export type ClientCollection = typeof collections.$inferSelect & { pieceCount: number; previews: string[] };

/** Collections that contain at least one piece this client can see. */
export async function listClientCollections(clientId: string): Promise<ClientCollection[]> {
  const rows = await db
    .select({ c: collections, count: sql<number>`count(${products.id})::int` })
    .from(collections)
    .innerJoin(products, eq(products.collectionId, collections.id))
    .where(and(accessibleTo(clientId), eq(collections.isPublished, true)))
    .groupBy(collections.id)
    .orderBy(asc(collections.sortOrder));
  const pieces = await listPieces(clientId);
  return rows.map(({ c, count }) => ({
    ...c,
    pieceCount: count,
    previews: pieces.filter((p) => p.collection?.slug === c.slug && p.image).slice(0, 3).map((p) => p.image!),
  }));
}

export async function getClientCollection(clientId: string, slug: string) {
  const all = await listClientCollections(clientId);
  const col = all.find((c) => c.slug === slug);
  if (!col) return null;
  const index = all.indexOf(col);
  return { collection: col, index, next: all[(index + 1) % all.length], total: all.length };
}

export async function shortlistIds(clientId: string) {
  const rows = await db.select({ id: shortlist.productId }).from(shortlist).where(eq(shortlist.clientId, clientId));
  return rows.map((r) => r.id);
}

export async function listShortlist(clientId: string) {
  const saved = await db
    .select({ productId: shortlist.productId, createdAt: shortlist.createdAt })
    .from(shortlist)
    .where(eq(shortlist.clientId, clientId))
    .orderBy(desc(shortlist.createdAt));
  if (!saved.length) return [];
  // Re-check access: a piece may have been withdrawn since it was saved.
  const visible = await listPieces(clientId);
  const map = new Map(visible.map((p) => [p.id, p]));
  return saved.filter((s) => map.has(s.productId)).map((s) => ({ piece: map.get(s.productId)!, addedAt: s.createdAt }));
}
