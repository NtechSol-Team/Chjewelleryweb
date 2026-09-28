"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireClient } from "@/lib/auth/session";
import { canAccessProduct, listPieces } from "@/lib/catalogue";
import { logActivity } from "@/lib/activity";

export async function toggleShortlist(productId: string, code: string) {
  const { client } = await requireClient();
  if (!(await canAccessProduct(client.id, productId))) return { ok: false as const, saved: false };

  const [existing] = await db
    .select()
    .from(schema.shortlist)
    .where(and(eq(schema.shortlist.clientId, client.id), eq(schema.shortlist.productId, productId)))
    .limit(1);

  if (existing) {
    await db
      .delete(schema.shortlist)
      .where(and(eq(schema.shortlist.clientId, client.id), eq(schema.shortlist.productId, productId)));
    await logActivity({ actorType: "client", actorId: client.id, clientId: client.id, productId, type: "shortlist_remove", detail: code });
  } else {
    await db.insert(schema.shortlist).values({ clientId: client.id, productId });
    await logActivity({ actorType: "client", actorId: client.id, clientId: client.id, productId, type: "shortlist_add", detail: code });
  }
  revalidatePath("/shortlist");
  return { ok: true as const, saved: !existing };
}

const consultSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(50),
  preference: z.enum(["Private appointment", "Video consultation", "Call from my advisor"]),
  message: z.string().max(1200).optional(),
});

export async function requestConsultation(input: z.infer<typeof consultSchema>) {
  const { client } = await requireClient();
  const parsed = consultSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const };
  // Only pieces this client can actually see may be referenced.
  const visible = new Set((await listPieces(client.id)).map((p) => p.id));
  const ids = parsed.data.productIds.filter((id) => visible.has(id));
  if (!ids.length) return { ok: false as const };

  await db.insert(schema.consultations).values({
    clientId: client.id,
    productIds: ids,
    preference: parsed.data.preference,
    message: parsed.data.message?.trim() || null,
  });
  const codes = await db.select({ code: schema.products.code }).from(schema.products).where(inArray(schema.products.id, ids));
  await logActivity({
    actorType: "client",
    actorId: client.id,
    clientId: client.id,
    type: "consultation_request",
    detail: `${parsed.data.preference} · ${codes.map((c) => c.code).join(", ")}`,
  });
  return { ok: true as const };
}

export async function searchPieces(q: string) {
  const { client } = await requireClient();
  const query = q.trim().slice(0, 60);
  if (query.length < 2) return [];
  // Live suggestions are not logged; a submitted search is (see /jewellery).
  const results = await listPieces(client.id, { q: query });
  return results.slice(0, 8).map((p) => ({ code: p.code, name: p.name, category: p.category, image: p.image }));
}
