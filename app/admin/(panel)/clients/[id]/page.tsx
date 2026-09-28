import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, count } from "drizzle-orm";
import { Link2 } from "lucide-react";
import { requireAdmin, clientDisplayName } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { clientCatalogueSummary, recentActivity, viewsByDay, viewingTable } from "@/lib/admin/queries";
import { clientStatus } from "@/lib/admin/status";
import { getSettings } from "@/lib/settings";
import { daysUntil, formatDateTime, formatDuration, formatShortDate, relativeTime, requestTime } from "@/lib/format";
import { PageHeader, Card, Badge, ALink, Th, Td, Initials } from "@/components/admin/ui";
import { AreaChart } from "@/components/admin/charts";
import { ActivityTimeline } from "@/components/admin/activity-list";
import { ClientActions } from "@/components/admin/client-actions";
import { ClientForm } from "@/components/admin/client-form";

export const metadata: Metadata = { title: "Client" };

const REASONS: Record<string, string> = { logout: "Signed out", superseded: "Signed in elsewhere", admin: "Ended by advisor", disabled: "Account disabled", timeout: "Timed out" };

export default async function ClientPage({ params }: PageProps<"/admin/clients/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [c] = await db.select().from(schema.clients).where(eq(schema.clients.id, id)).limit(1);
  if (!c) notFound();

  const [settings, catalogue, series, pieces, activity, sessions, advisors, [{ n: saved }]] = await Promise.all([
    getSettings(),
    clientCatalogueSummary(id),
    viewsByDay(30, id),
    viewingTable({ clientId: id, sinceDays: 90 }),
    recentActivity({ clientId: id, limit: 25 }),
    db.select().from(schema.sessions).where(and(eq(schema.sessions.subjectType, "client"), eq(schema.sessions.subjectId, id))).orderBy(desc(schema.sessions.createdAt)).limit(10),
    db.select({ name: schema.admins.name }).from(schema.admins),
    db.select({ n: count() }).from(schema.shortlist).where(eq(schema.shortlist.clientId, id)),
  ]);

  const name = clientDisplayName(c);
  const st = clientStatus(c);
  const now = requestTime();
  const idleCut = now - settings.session.idleMinutes * 60_000;
  const live = sessions.find((s) => !s.revokedAt && s.expiresAt.getTime() > now && s.lastSeenAt.getTime() > idleCut);
  const totalMs = pieces.reduce((s, p) => s + p.ms, 0);
  const totalViews = pieces.reduce((s, p) => s + p.views, 0);
  const left = daysUntil(c.accessEndsAt);
  const shortDay = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

  return (
    <>
      <PageHeader
        eyebrow="Client"
        title={name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={st.tone}>{st.label}</Badge>
            {live ? <Badge tone="ok">Online · {live.userAgent}</Badge> : <span>Last seen {relativeTime(c.lastLoginAt)}</span>}
          </span>
        }
        actions={<ClientActions variant="buttons" id={c.id} name={name} status={c.status} online={!!live} />}
      />

      <div className="grid gap-5 p-5 md:p-8 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Pieces viewed", pieces.length],
              ["Views (90d)", totalViews],
              ["Viewing time", formatDuration(totalMs)],
              ["Shortlisted", saved],
            ].map(([l, v]) => (
              <div key={l} className="rounded-md border border-a-line bg-white p-4">
                <p className="text-[12px] text-a-muted">{l}</p>
                <p className="mt-2 text-[22px] font-semibold tracking-tight">{v}</p>
              </div>
            ))}
          </div>

          <Card title="Viewing behaviour" description="Piece views per day, last 30 days">
            <AreaChart height={180} data={series.map((d) => ({ label: shortDay(d.day), value: d.views }))} ariaLabel={`Daily views by ${name}`} />
          </Card>

          <Card title="Pieces viewed" description="Last 90 days, most recent first" bodyClassName="p-0">
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr>
                    <Th>Piece</Th>
                    <Th align="right">Views</Th>
                    <Th align="right">View time</Th>
                    <Th>Last viewed</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {pieces.map((p) => (
                    <tr key={p.productId}>
                      <Td>
                        <Link href={`/admin/products/${p.productId}`} className="hover:underline">
                          <span className="font-medium">{p.code}</span> <span className="text-a-muted">{p.name}</span>
                        </Link>
                      </Td>
                      <Td align="right">{p.views}</Td>
                      <Td align="right">{formatDuration(p.ms)}</Td>
                      <Td className="text-a-muted">{relativeTime(p.lastViewed)}</Td>
                      <Td>{p.discussed ? <Badge tone="gold">Discussed</Badge> : p.shortlisted ? <Badge tone="gold" dot={false}>♡ Shortlisted</Badge> : <span className="text-a-muted">Viewed</span>}</Td>
                    </tr>
                  ))}
                  {pieces.length === 0 && (
                    <tr>
                      <Td className="py-8 text-center text-a-muted">No viewing recorded yet.</Td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Activity">
            {activity.length ? <ActivityTimeline rows={activity} /> : <p className="text-[13px] text-a-muted">No activity yet.</p>}
          </Card>

          <Card title="Edit details" className="scroll-mt-6" bodyClassName="p-5">
            <div id="edit" />
            <ClientForm
              clientId={c.id}
              advisors={advisors.map((a) => a.name)}
              initial={{ ...c, accessStartsAt: iso(c.accessStartsAt), accessEndsAt: iso(c.accessEndsAt) }}
            />
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Details">
            <div className="flex items-center gap-3">
              <Initials name={name} className="h-10 w-10 text-[13px]" />
              <div>
                <p className="text-[14px] font-medium">{name}</p>
                <p className="text-[12px] text-a-muted">{[c.company, c.city].filter(Boolean).join(" · ") || "—"}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-[13px]">
              {[
                ["Username", <span key="u" className="font-mono text-[12px]">{c.username}</span>],
                ["Email", c.email ?? "—"],
                ["Phone", c.phone ?? "—"],
                ["Advisor", c.advisor ?? "—"],
                ["Access", `${formatShortDate(c.accessStartsAt)} → ${formatShortDate(c.accessEndsAt)}${left !== null ? (left >= 0 ? ` · ${left} days left` : " · ended") : ""}`],
                ["Client since", formatShortDate(c.createdAt)],
              ].map(([k, v]) => (
                <div key={String(k)} className="grid grid-cols-[6.5rem_1fr] gap-3">
                  <dt className="text-a-muted">{k}</dt>
                  <dd className="min-w-0 break-words">{v}</dd>
                </div>
              ))}
            </dl>
            {c.notes && <p className="mt-4 rounded-md bg-a-subtle p-3 text-[12.5px] text-a-text/80">{c.notes}</p>}
          </Card>

          <Card title="Assigned catalogue" description={`${catalogue.totalPieces} pieces visible to this client`} actions={<ALink href={`/admin/assignments?client=${c.id}`} className="h-8"><Link2 className="h-3.5 w-3.5" /> Edit</ALink>}>
            <p className="text-[12px] font-medium text-a-muted">Collections</p>
            <ul className="mt-2 space-y-1.5">
              {catalogue.collections.map((col) => (
                <li key={col.id} className="flex items-center gap-2 text-[13px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-champagne" /> {col.name}
                </li>
              ))}
              {!catalogue.collections.length && <li className="text-[13px] text-a-muted">None</li>}
            </ul>
            <p className="mt-5 text-[12px] font-medium text-a-muted">Individual pieces</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {catalogue.products.map((p) => (
                <span key={p.id} title={p.name} className="rounded bg-a-subtle px-2 py-0.5 text-[12px]">
                  {p.code}
                </span>
              ))}
              {!catalogue.products.length && <span className="text-[13px] text-a-muted">None</span>}
            </div>
          </Card>

          <Card title="Access history" bodyClassName="p-0">
            <ul>
              {sessions.map((s) => {
                const isLive = s.id === live?.id;
                return (
                  <li key={s.id} className="border-b border-a-line px-5 py-3 last:border-0">
                    <div className="flex items-center justify-between gap-2 text-[13px]">
                      <span className="font-medium">{s.userAgent ?? "Unknown device"}</span>
                      {isLive ? <Badge tone="ok">Live</Badge> : <span className="text-[12px] text-a-muted">{s.revokedReason ? REASONS[s.revokedReason] : "Expired"}</span>}
                    </div>
                    <p className="mt-0.5 text-[12px] text-a-muted">
                      {formatDateTime(s.createdAt)} · {s.ip}
                    </p>
                  </li>
                );
              })}
              {!sessions.length && <li className="px-5 py-4 text-[13px] text-a-muted">Never signed in.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
