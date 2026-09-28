"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { createSession, endSession, requireAdmin } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity";

const { clients, sessions, clientCollections, clientProducts, products, productMedia, collections, settings } = schema;

// ————————————————————————— Auth

export type AdminLoginState = { error?: string; email?: string };

export async function adminLogin(_: AdminLoginState, form: FormData): Promise<AdminLoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const [admin] = await db.select().from(schema.admins).where(eq(schema.admins.email, email)).limit(1);
  const ok = admin && (await bcrypt.compare(password, admin.passwordHash));
  if (!ok) return { error: "Incorrect email or password.", email };
  await createSession("admin", admin.id);
  await db.update(schema.admins).set({ lastLoginAt: new Date() }).where(eq(schema.admins.id, admin.id));
  redirect("/admin/dashboard");
}

export async function adminLogout() {
  await endSession("admin");
  redirect("/admin/login");
}

// ————————————————————————— Clients

async function revokeClientSessions(clientId: string, reason: "admin" | "disabled") {
  const res = await db
    .update(sessions)
    .set({ revokedAt: new Date(), revokedReason: reason })
    .where(and(eq(sessions.subjectType, "client"), eq(sessions.subjectId, clientId), isNull(sessions.revokedAt)))
    .returning({ id: sessions.id });
  return res.length;
}

export async function forceLogout(clientId: string) {
  const { admin } = await requireAdmin();
  const n = await revokeClientSessions(clientId, "admin");
  await logActivity({ actorType: "admin", actorId: admin.id, clientId, type: "session_revoked", detail: `Ended by ${admin.name}` });
  revalidatePath("/admin", "layout");
  return { ok: true, revoked: n };
}

export async function revokeSession(sessionId: string) {
  const { admin } = await requireAdmin();
  const [s] = await db
    .update(sessions)
    .set({ revokedAt: new Date(), revokedReason: "admin" })
    .where(and(eq(sessions.id, sessionId), isNull(sessions.revokedAt)))
    .returning();
  if (s?.subjectType === "client")
    await logActivity({ actorType: "admin", actorId: admin.id, clientId: s.subjectId, type: "session_revoked", detail: `Ended by ${admin.name}` });
  revalidatePath("/admin/sessions");
  return { ok: !!s };
}

export async function setClientStatus(clientId: string, status: "active" | "disabled") {
  const { admin } = await requireAdmin();
  await db.update(clients).set({ status }).where(eq(clients.id, clientId));
  if (status === "disabled") await revokeClientSessions(clientId, "disabled");
  await logActivity({
    actorType: "admin",
    actorId: admin.id,
    clientId,
    type: status === "disabled" ? "account_disabled" : "account_enabled",
    detail: admin.name,
  });
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** Generates a one-time password, shown once to the advisor. */
export async function resetClientPassword(clientId: string) {
  const { admin } = await requireAdmin();
  const temp = `CH-${randomBytes(3).toString("hex").toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;
  await db.update(clients).set({ passwordHash: await bcrypt.hash(temp, 10) }).where(eq(clients.id, clientId));
  await revokeClientSessions(clientId, "admin");
  await logActivity({ actorType: "admin", actorId: admin.id, clientId, type: "password_reset", detail: admin.name });
  return { ok: true, password: temp };
}

const clientSchema = z.object({
  salutation: z.string().max(10).optional(),
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  company: z.string().max(120).optional(),
  city: z.string().max(80).optional(),
  email: z.union([z.literal(""), z.string().email()]).optional(),
  phone: z.string().max(40).optional(),
  username: z.string().trim().min(3).max(60).regex(/^[a-z0-9._-]+$/i, "Letters, numbers, dots and dashes only"),
  password: z.string().max(200).optional(),
  advisor: z.string().max(80).optional(),
  accessStartsAt: z.string().optional(),
  accessEndsAt: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export type ClientFormState = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean };

export async function saveClient(clientId: string | null, _: ClientFormState, form: FormData): Promise<ClientFormState> {
  const { admin } = await requireAdmin();
  const raw = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] = i.message;
    return { error: "Please review the highlighted fields.", fieldErrors };
  }
  const d = parsed.data;
  if (!clientId && (!d.password || d.password.length < 8)) return { error: "Set an initial password of at least 8 characters.", fieldErrors: { password: "Minimum 8 characters" } };

  const values = {
    salutation: d.salutation || null,
    firstName: d.firstName,
    lastName: d.lastName,
    company: d.company || null,
    city: d.city || null,
    email: d.email || null,
    phone: d.phone || null,
    username: d.username.toLowerCase(),
    advisor: d.advisor || null,
    notes: d.notes || null,
    accessStartsAt: d.accessStartsAt ? new Date(d.accessStartsAt) : null,
    accessEndsAt: d.accessEndsAt ? new Date(`${d.accessEndsAt}T23:59:59`) : null,
  };

  try {
    if (clientId) {
      await db
        .update(clients)
        .set({ ...values, ...(d.password ? { passwordHash: await bcrypt.hash(d.password, 10) } : {}) })
        .where(eq(clients.id, clientId));
      await logActivity({ actorType: "admin", actorId: admin.id, clientId, type: "client_updated", detail: admin.name });
    } else {
      const [row] = await db
        .insert(clients)
        .values({ ...values, passwordHash: await bcrypt.hash(d.password!, 10) })
        .returning();
      await logActivity({ actorType: "admin", actorId: admin.id, clientId: row.id, type: "client_created", detail: admin.name });
      revalidatePath("/admin/clients");
      redirect(`/admin/assignments?client=${row.id}&new=1`);
    }
  } catch (e) {
    if (e instanceof Error && /unique/i.test(e.message)) return { error: "That username is already in use.", fieldErrors: { username: "Already in use" } };
    throw e;
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ————————————————————————— Catalogue assignment

export async function saveAssignments(clientId: string, collectionIds: string[], productIds: string[]) {
  const { admin } = await requireAdmin();
  const ids = z.array(z.string().uuid());
  const cols = ids.parse(collectionIds);
  const prods = ids.parse(productIds);

  await db.transaction(async (tx) => {
    await tx.delete(clientCollections).where(eq(clientCollections.clientId, clientId));
    await tx.delete(clientProducts).where(eq(clientProducts.clientId, clientId));
    if (cols.length) await tx.insert(clientCollections).values(cols.map((collectionId) => ({ clientId, collectionId })));
    if (prods.length) await tx.insert(clientProducts).values(prods.map((productId) => ({ clientId, productId })));
  });
  await logActivity({
    actorType: "admin",
    actorId: admin.id,
    clientId,
    type: "catalogue_updated",
    detail: `${cols.length} collections · ${prods.length} individual pieces`,
  });
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ————————————————————————— Products

const productSchema = z.object({
  code: z.string().trim().min(2).max(20).regex(/^[A-Z0-9-]+$/, "Uppercase letters, numbers and dashes"),
  name: z.string().trim().min(2).max(120),
  category: z.string().min(1),
  gender: z.enum(["FEMALE", "MALE"]),
  shape: z.string().optional(),
  collectionId: z.string().optional(),
  description: z.string().max(3000).optional(),
  status: z.enum(["published", "draft", "archived"]),
  isNew: z.string().optional(),
  specifications: z.string().optional(),
});

export type ProductFormState = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean; savedAt?: number };

export async function saveProduct(productId: string | null, _: ProductFormState, form: FormData): Promise<ProductFormState> {
  const { admin } = await requireAdmin();
  const raw = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
  raw.code = (raw.code ?? "").toUpperCase();
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] = i.message;
    return { error: "Please review the highlighted fields.", fieldErrors };
  }
  const d = parsed.data;
  let specs: { label: string; value: string }[] = [];
  try {
    specs = JSON.parse(d.specifications || "[]").filter((s: { label: string; value: string }) => s.label?.trim() && s.value?.trim());
  } catch {}

  const values = {
    code: d.code,
    name: d.name,
    category: d.category,
    gender: d.gender,
    shape: d.shape || null,
    collectionId: d.collectionId || null,
    description: d.description || null,
    status: d.status,
    isNew: d.isNew === "on",
    specifications: specs,
    updatedAt: new Date(),
  };

  try {
    if (productId) {
      await db.update(products).set(values).where(eq(products.id, productId));
      await logActivity({ actorType: "admin", actorId: admin.id, productId, type: "product_updated", detail: `${d.code} · ${admin.name}` });
    } else {
      const [row] = await db.insert(products).values(values).returning();
      await logActivity({ actorType: "admin", actorId: admin.id, productId: row.id, type: "product_created", detail: `${d.code} · ${admin.name}` });
      redirect(`/admin/products/${row.id}?created=1`);
    }
  } catch (e) {
    if (e instanceof Error && /unique/i.test(e.message)) return { error: "That product code already exists.", fieldErrors: { code: "Already exists" } };
    throw e;
  }
  revalidatePath("/admin/products");
  return { ok: true, savedAt: Date.now() };
}

export async function deleteMedia(mediaId: string) {
  await requireAdmin();
  const [m] = await db.delete(productMedia).where(eq(productMedia.id, mediaId)).returning();
  if (m) revalidatePath(`/admin/products/${m.productId}`);
  return { ok: !!m };
}

export async function reorderMedia(productId: string, orderedIds: string[]) {
  await requireAdmin();
  await db.transaction(async (tx) => {
    for (const [i, id] of orderedIds.entries())
      await tx.update(productMedia).set({ sortOrder: i }).where(and(eq(productMedia.id, id), eq(productMedia.productId, productId)));
  });
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}

export async function addVideoUrl(productId: string, url: string, posterUrl?: string) {
  await requireAdmin();
  const u = z.string().url().parse(url);
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${productMedia.sortOrder}), -1)`.mapWith(Number) })
    .from(productMedia)
    .where(eq(productMedia.productId, productId));
  await db.insert(productMedia).values({ productId, kind: "video", url: u, posterUrl: posterUrl || null, sortOrder: max + 1 });
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}

export async function setProductsStatus(ids: string[], status: "published" | "draft" | "archived") {
  await requireAdmin();
  if (!ids.length) return { ok: true };
  await db.update(products).set({ status, updatedAt: new Date() }).where(inArray(products.id, ids));
  revalidatePath("/admin/products");
  return { ok: true };
}

// ————————————————————————— Collections

const collectionSchema = z.object({
  name: z.string().trim().min(2).max(80),
  tagline: z.string().max(160).optional(),
  description: z.string().max(1000).optional(),
  coverUrl: z.union([z.literal(""), z.string().url(), z.string().startsWith("/api/media/")]).optional(),
});

export async function saveCollection(collectionId: string | null, input: z.infer<typeof collectionSchema>) {
  await requireAdmin();
  const d = collectionSchema.parse(input);
  const slug = d.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (collectionId) {
    await db
      .update(collections)
      .set({ name: d.name, tagline: d.tagline || null, description: d.description || null, coverUrl: d.coverUrl || null })
      .where(eq(collections.id, collectionId));
  } else {
    const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${collections.sortOrder}),0)`.mapWith(Number) }).from(collections);
    await db.insert(collections).values({ slug, name: d.name, tagline: d.tagline || null, description: d.description || null, coverUrl: d.coverUrl || null, sortOrder: max + 1 });
  }
  revalidatePath("/admin/collections");
  return { ok: true };
}

export async function setCollectionPublished(collectionId: string, isPublished: boolean) {
  await requireAdmin();
  await db.update(collections).set({ isPublished }).where(eq(collections.id, collectionId));
  revalidatePath("/admin/collections");
  return { ok: true };
}

export async function moveCollection(collectionId: string, direction: -1 | 1) {
  await requireAdmin();
  const all = await db.select().from(collections).orderBy(collections.sortOrder);
  const i = all.findIndex((c) => c.id === collectionId);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= all.length) return { ok: false };
  await db.transaction(async (tx) => {
    await tx.update(collections).set({ sortOrder: all[j].sortOrder }).where(eq(collections.id, all[i].id));
    await tx.update(collections).set({ sortOrder: all[i].sortOrder }).where(eq(collections.id, all[j].id));
  });
  revalidatePath("/admin/collections");
  return { ok: true };
}

// ————————————————————————— Settings

const settingsSchema = z.object({
  watermark: z.object({ enabled: z.boolean(), opacity: z.number().min(0.02).max(0.3) }),
  privacyBlur: z.object({ enabled: z.boolean() }),
  session: z.object({ idleMinutes: z.number().int().min(5).max(240), maxHours: z.number().int().min(1).max(72), singleSession: z.boolean() }),
  concierge: z.object({ phone: z.string().max(40), email: z.string().email(), hours: z.string().max(80) }),
});

export async function saveSettings(input: z.infer<typeof settingsSchema>) {
  await requireAdmin();
  const d = settingsSchema.parse(input);
  for (const [key, value] of Object.entries(d)) {
    await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
