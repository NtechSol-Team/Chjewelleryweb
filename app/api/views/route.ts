import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { validateClientSession } from "@/lib/auth/session";
import { canAccessProduct } from "@/lib/catalogue";
import { logActivity } from "@/lib/activity";

const body = z.object({
  viewId: z.string().uuid(),
  productId: z.string().uuid(),
  deltaMs: z.number().int().min(0).max(60_000),
  start: z.boolean().optional(),
  code: z.string().max(40).optional(),
});

/**
 * Viewing telemetry for the admin analytics: a view row is opened when a
 * piece is displayed and accumulates foreground time via small beacons.
 */
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const { viewId, productId, deltaMs, start, code } = parsed.data;

  // Watching a piece in the foreground counts as activity for the idle timer.
  const session = await validateClientSession(true);
  if (!session.ok) return NextResponse.json({ ok: false, reason: session.reason }, { status: 401 });
  const clientId = session.subject.id;

  if (start) {
    if (!(await canAccessProduct(clientId, productId))) return NextResponse.json({ ok: false }, { status: 403 });
    await db
      .insert(schema.productViews)
      .values({ id: viewId, clientId, productId, sessionId: session.session.id, durationMs: deltaMs })
      .onConflictDoNothing();
    await logActivity({ actorType: "client", actorId: clientId, clientId, productId, type: "view_product", detail: code });
  } else {
    await db
      .update(schema.productViews)
      .set({ durationMs: sql`${schema.productViews.durationMs} + ${deltaMs}`, lastPingAt: new Date() })
      .where(and(eq(schema.productViews.id, viewId), eq(schema.productViews.clientId, clientId)));
  }
  return NextResponse.json({ ok: true });
}
