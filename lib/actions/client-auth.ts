"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { clientAccessProblem, createSession, endSession, getClientSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity";

export type LoginState = {
  error?: "invalid" | "disabled" | "access-expired" | "access-pending" | "throttled" | "missing";
  username?: string;
};

// Constant-time-ish failure path: compare against a dummy hash when the user is unknown.
const DUMMY_HASH = bcrypt.hashSync("ch-jewels-timing-guard", 10);

// Simple in-process throttle (replace with Redis/Upstash in production).
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW = 15 * 60_000;
const LIMIT = 6;

function throttled(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.first > WINDOW) return false;
  return entry.count >= LIMIT;
}
function recordFailure(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.first > WINDOW) attempts.set(key, { count: 1, first: now });
  else entry.count++;
}

const schemaLogin = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(200),
});

export async function clientLogin(_: LoginState, form: FormData): Promise<LoginState> {
  const parsed = schemaLogin.safeParse({ username: form.get("username"), password: form.get("password") });
  if (!parsed.success) return { error: "missing", username: String(form.get("username") ?? "") };
  const { username, password } = parsed.data;

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "local";
  const key = `${username.toLowerCase()}|${ip}`;
  if (throttled(key)) return { error: "throttled", username };

  const [client] = await db
    .select()
    .from(schema.clients)
    .where(eq(sql`lower(${schema.clients.username})`, username.toLowerCase()))
    .limit(1);

  const ok = await bcrypt.compare(password, client?.passwordHash ?? DUMMY_HASH);
  if (!client || !ok) {
    recordFailure(key);
    if (client) await logActivity({ actorType: "client", actorId: client.id, clientId: client.id, type: "login_failed" });
    return { error: "invalid", username };
  }

  const problem = clientAccessProblem(client);
  if (problem === "disabled" || problem === "access-expired" || problem === "access-pending") {
    return { error: problem, username };
  }

  attempts.delete(key);
  const session = await createSession("client", client.id);
  await db.update(schema.clients).set({ lastLoginAt: new Date() }).where(eq(schema.clients.id, client.id));
  await logActivity({ actorType: "client", actorId: client.id, clientId: client.id, type: "login", detail: session.userAgent });
  redirect("/welcome");
}

export async function clientLogout() {
  const res = await getClientSession();
  if (res.ok) await logActivity({ actorType: "client", actorId: res.subject.id, clientId: res.subject.id, type: "logout" });
  await endSession("client");
  redirect("/login?signed-out=1");
}
