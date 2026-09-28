import type { Metadata } from "next";
import { and, count, eq, gte, isNull, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { AdminShell } from "@/components/admin/shell";

export const metadata: Metadata = { title: { default: "Console", template: "%s · CH Console" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin } = await requireAdmin();
  const { session } = await getSettings();
  const [{ n }] = await db
    .select({ n: count() })
    .from(schema.sessions)
    .where(
      and(
        eq(schema.sessions.subjectType, "client"),
        isNull(schema.sessions.revokedAt),
        gte(schema.sessions.expiresAt, sql`now()`),
        gte(schema.sessions.lastSeenAt, sql`now() - make_interval(mins => ${session.idleMinutes})`),
      ),
    );
  return (
    <AdminShell admin={{ name: admin.name, role: admin.role }} liveSessions={n}>
      {children}
    </AdminShell>
  );
}
