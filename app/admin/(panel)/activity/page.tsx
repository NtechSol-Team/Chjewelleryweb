import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { requireAdmin, clientDisplayName } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { recentActivity } from "@/lib/admin/queries";
import { PageHeader, Card, AButton, inlineInput } from "@/components/admin/ui";
import { ActivityTimeline } from "@/components/admin/activity-list";

export const metadata: Metadata = { title: "Activity" };

const GROUPS: Record<string, { label: string; types?: string[] }> = {
  "": { label: "All events" },
  access: { label: "Sign-ins & sessions", types: ["login", "logout", "login_failed", "session_revoked"] },
  viewing: { label: "Viewing", types: ["view_product", "view_collection", "search"] },
  interest: { label: "Shortlist & consultations", types: ["shortlist_add", "shortlist_remove", "consultation_request"] },
  admin: { label: "Staff actions", types: ["account_disabled", "account_enabled", "password_reset", "catalogue_updated", "client_created", "client_updated", "product_created", "product_updated"] },
};

export default async function ActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  await requireAdmin();
  const sp = await searchParams;
  const client = typeof sp.client === "string" ? sp.client : "";
  const group = typeof sp.type === "string" && sp.type in GROUPS ? sp.type : "";
  const days = Number(sp.days) || 7;

  const [clients, rows] = await Promise.all([
    db.select().from(schema.clients).orderBy(asc(schema.clients.lastName)),
    recentActivity({ clientId: client || undefined, types: GROUPS[group].types, sinceDays: days, limit: 400 }),
  ]);

  const byDay = new Map<string, typeof rows>();
  for (const r of rows) {
    const k = new Date(r.createdAt).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    byDay.set(k, [...(byDay.get(k) ?? []), r]);
  }

  return (
    <>
      <PageHeader title="Activity" description="An audit trail of every sign-in, view, shortlist and staff action." />
      <div className="p-5 md:p-8">
        <form className="mb-5 flex flex-wrap items-center gap-2">
          <select name="client" defaultValue={client} className={`${inlineInput} w-auto`} aria-label="Client">
            <option value="">All clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{clientDisplayName(c)}</option>
            ))}
          </select>
          <select name="type" defaultValue={group} className={`${inlineInput} w-auto`} aria-label="Event type">
            {Object.entries(GROUPS).map(([k, g]) => (
              <option key={k} value={k}>{g.label}</option>
            ))}
          </select>
          <select name="days" defaultValue={String(days)} className={`${inlineInput} w-auto`} aria-label="Period">
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <AButton type="submit">Apply</AButton>
          <span className="ml-auto text-[12px] text-a-muted">{rows.length} events</span>
        </form>
        <div className="max-w-3xl space-y-5">
          {[...byDay.entries()].map(([day, list]) => (
            <Card key={day} title={day} description={`${list.length} events`}>
              <ActivityTimeline rows={list} />
            </Card>
          ))}
          {rows.length === 0 && <Card><p className="py-6 text-center text-[13px] text-a-muted">No activity in this period.</p></Card>}
        </div>
      </div>
    </>
  );
}
