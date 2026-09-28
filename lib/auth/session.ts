import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull, ne } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export const CLIENT_COOKIE = "chj_client";
export const ADMIN_COOKIE = "chj_admin";

export type AccessReason =
  | "required"
  | "session-expired"
  | "signed-in-elsewhere"
  | "ended-by-advisor"
  | "disabled"
  | "access-expired"
  | "access-pending";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

type SubjectType = "client" | "admin";
const cookieFor = (t: SubjectType) => (t === "client" ? CLIENT_COOKIE : ADMIN_COOKIE);

export async function createSession(subjectType: SubjectType, subjectId: string) {
  const { session: cfg } = await getSettings();
  const token = randomBytes(32).toString("base64url");
  const h = await headers();
  const now = new Date();

  const [row] = await db
    .insert(schema.sessions)
    .values({
      tokenHash: hash(token),
      subjectType,
      subjectId,
      userAgent: describeAgent(h.get("user-agent") ?? ""),
      ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1",
      expiresAt: new Date(now.getTime() + cfg.maxHours * 3_600_000),
    })
    .returning();

  // Single active session: any earlier session for this client is superseded.
  if (subjectType === "client" && cfg.singleSession) {
    await db
      .update(schema.sessions)
      .set({ revokedAt: now, revokedReason: "superseded" })
      .where(
        and(
          eq(schema.sessions.subjectType, "client"),
          eq(schema.sessions.subjectId, subjectId),
          isNull(schema.sessions.revokedAt),
          ne(schema.sessions.id, row.id),
        ),
      );
  }

  const jar = await cookies();
  jar.set(cookieFor(subjectType), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: row.expiresAt,
  });
  return row;
}

export async function endSession(subjectType: SubjectType) {
  const jar = await cookies();
  const token = jar.get(cookieFor(subjectType))?.value;
  if (token) {
    await db
      .update(schema.sessions)
      .set({ revokedAt: new Date(), revokedReason: "logout" })
      .where(and(eq(schema.sessions.tokenHash, hash(token)), isNull(schema.sessions.revokedAt)));
  }
  jar.delete(cookieFor(subjectType));
}

type Valid<T> = { ok: true; session: typeof schema.sessions.$inferSelect; subject: T };
type Invalid = { ok: false; reason: AccessReason };

async function loadSession(subjectType: SubjectType) {
  const token = (await cookies()).get(cookieFor(subjectType))?.value;
  if (!token) return { ok: false as const, reason: "required" as AccessReason };
  const [s] = await db.select().from(schema.sessions).where(eq(schema.sessions.tokenHash, hash(token))).limit(1);
  if (!s || s.subjectType !== subjectType) return { ok: false as const, reason: "required" as AccessReason };

  if (s.revokedAt) {
    const reason: AccessReason =
      s.revokedReason === "superseded"
        ? "signed-in-elsewhere"
        : s.revokedReason === "admin"
          ? "ended-by-advisor"
          : s.revokedReason === "disabled"
            ? "disabled"
            : s.revokedReason === "timeout"
              ? "session-expired"
              : "required";
    return { ok: false as const, reason };
  }

  const { session: cfg } = await getSettings();
  const now = Date.now();
  const idle = now - s.lastSeenAt.getTime() > cfg.idleMinutes * 60_000;
  if (idle || s.expiresAt.getTime() < now) {
    await db.update(schema.sessions).set({ revokedAt: new Date(), revokedReason: "timeout" }).where(eq(schema.sessions.id, s.id));
    return { ok: false as const, reason: "session-expired" as AccessReason };
  }
  return { ok: true as const, session: s };
}

/** Sliding idle window: only write lastSeen at most once a minute. */
export async function touchSession(sessionId: string, lastSeenAt: Date) {
  if (Date.now() - lastSeenAt.getTime() < 60_000) return;
  await db.update(schema.sessions).set({ lastSeenAt: new Date() }).where(eq(schema.sessions.id, sessionId));
}

export function clientAccessProblem(c: typeof schema.clients.$inferSelect): AccessReason | null {
  if (c.status === "disabled") return "disabled";
  const now = Date.now();
  if (c.accessStartsAt && c.accessStartsAt.getTime() > now) return "access-pending";
  if (c.accessEndsAt && c.accessEndsAt.getTime() < now) return "access-expired";
  return null;
}

/**
 * Validates the client session. `touch` extends the idle window — page renders
 * and genuine interaction do; background heartbeats from an idle tab do not.
 */
export async function validateClientSession(touch: boolean): Promise<Valid<typeof schema.clients.$inferSelect> | Invalid> {
  const res = await loadSession("client");
  if (!res.ok) return res;
  const [c] = await db.select().from(schema.clients).where(eq(schema.clients.id, res.session.subjectId)).limit(1);
  if (!c) return { ok: false, reason: "required" };
  const problem = clientAccessProblem(c);
  if (problem) return { ok: false, reason: problem };
  if (touch) await touchSession(res.session.id, res.session.lastSeenAt);
  return { ok: true, session: res.session, subject: c };
}

export const getClientSession = cache(() => validateClientSession(true));

export const getAdminSession = cache(async (): Promise<Valid<typeof schema.admins.$inferSelect> | Invalid> => {
  const res = await loadSession("admin");
  if (!res.ok) return res;
  const [a] = await db.select().from(schema.admins).where(eq(schema.admins.id, res.session.subjectId)).limit(1);
  if (!a) return { ok: false, reason: "required" };
  await touchSession(res.session.id, res.session.lastSeenAt);
  return { ok: true, session: res.session, subject: a };
});

export async function requireClient() {
  const res = await getClientSession();
  if (!res.ok) redirect(`/access?reason=${res.reason}`);
  return { client: res.subject, session: res.session };
}

export async function requireAdmin() {
  const res = await getAdminSession();
  if (!res.ok) redirect(`/admin/login${res.reason === "required" ? "" : "?expired=1"}`);
  return { admin: res.subject, session: res.session };
}

export function describeAgent(ua: string) {
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : "Device";
  return `${browser} · ${os}`;
}

export const clientDisplayName = (c: { salutation: string | null; firstName: string; lastName: string }) =>
  [c.salutation, c.firstName, c.lastName].filter(Boolean).join(" ");
