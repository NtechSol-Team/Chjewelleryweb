import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Gem, Heart, MonitorSmartphone, Users, UserCheck, Clock, MessageSquare } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { clientEngagement, consultationsAdmin, dashboardStats, durationByCategory, recentActivity, topProducts, viewsByDay } from "@/lib/admin/queries";
import { formatDuration, relativeTime } from "@/lib/format";
import { categoryLabel } from "@/lib/taxonomy";
import { PageHeader, Card, StatTile, ALink, Badge } from "@/components/admin/ui";
import { AreaChart, BarList, ChartTable } from "@/components/admin/charts";
import { ActivityTimeline } from "@/components/admin/activity-list";

export const metadata: Metadata = { title: "Dashboard" };

const shortDay = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default async function Dashboard() {
  const { admin } = await requireAdmin();
  const [stats, series, top, engagement, durations, activity, consults] = await Promise.all([
    dashboardStats(),
    viewsByDay(30),
    topProducts(8),
    clientEngagement(30),
    durationByCategory(30),
    recentActivity({ limit: 12 }),
    consultationsAdmin(4),
  ]);
  const minutes = series.map((d) => ({ label: shortDay(d.day), value: Math.round(d.ms / 60000) }));
  const views30 = series.reduce((s, d) => s + d.views, 0);

  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${admin.name.split(" ")[0]}`}
        description="Private showroom performance over the last 30 days."
        actions={
          <>
            <ALink href="/admin/analytics">Open analytics</ALink>
            <ALink href="/admin/clients/new" variant="primary">
              Add client
            </ALink>
          </>
        }
      />

      <div className="space-y-5 p-5 md:p-8">
        <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
          <StatTile label="Total clients" value={stats.totalClients} icon={<Users className="h-4 w-4" strokeWidth={1.6} />} hint={`${stats.totalClients - stats.activeClients} inactive or expired`} />
          <StatTile label="Active clients" value={stats.activeClients} icon={<UserCheck className="h-4 w-4" strokeWidth={1.6} />} hint="Enabled and within access window" />
          <StatTile label="Products" value={stats.products} icon={<Gem className="h-4 w-4" strokeWidth={1.6} />} hint="Published pieces" />
          <StatTile label="Total views" value={stats.totalViews.toLocaleString("en-GB")} icon={<Eye className="h-4 w-4" strokeWidth={1.6} />} hint={`${formatDuration(stats.totalViewMs)} viewing time`} />
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
          <StatTile label="Today's views" value={stats.todayViews} icon={<Clock className="h-4 w-4" strokeWidth={1.6} />} />
          <StatTile
            label="Active sessions"
            value={
              <span className="flex items-center gap-2">
                {stats.activeSessions}
                {stats.activeSessions > 0 && <Badge tone="ok">Live</Badge>}
              </span>
            }
            icon={<MonitorSmartphone className="h-4 w-4" strokeWidth={1.6} />}
          />
          <StatTile label="Shortlisted pieces" value={stats.shortlisted} icon={<Heart className="h-4 w-4" strokeWidth={1.6} />} />
          <StatTile
            label="Consultation requests"
            value={stats.newConsultations}
            icon={<MessageSquare className="h-4 w-4" strokeWidth={1.6} />}
            hint="Awaiting follow-up"
            accent={stats.newConsultations > 0}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <Card className="xl:col-span-2" title="Views over time" description={`${views30.toLocaleString("en-GB")} piece views · last 30 days`}>
            <AreaChart height={330} data={series.map((d) => ({ label: shortDay(d.day), value: d.views }))} ariaLabel="Daily piece views over the last 30 days" />
            <ChartTable columns={["Day", "Views"]} rows={series.map((d) => [shortDay(d.day), d.views])} />
          </Card>
          <Card title="Most viewed products" description="By number of views, 30 days" actions={<Link href="/admin/analytics" className="text-[12px] text-a-muted hover:text-a-text">All →</Link>}>
            <BarList
              ariaLabel="Most viewed products"
              items={top.map((p) => ({ label: p.code, sub: p.name, value: p.views, meta: `${p.viewers} ${p.viewers === 1 ? "client" : "clients"}` }))}
            />
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <Card title="Client activity" description="Views per client, 30 days">
            <BarList ariaLabel="Views per client" items={engagement.map((c) => ({ label: c.name, value: c.views, meta: formatDuration(c.ms) }))} />
          </Card>
          <Card title="Viewing duration" description="Average time per view, by category">
            <BarList ariaLabel="Average viewing duration by category" unit="seconds" items={durations.map((d) => ({ label: categoryLabel(d.category), value: Math.round(d.avgMs / 1000), meta: `${d.views} views` }))} />
            <ChartTable columns={["Category", "Avg. time", "Views"]} rows={durations.map((d) => [categoryLabel(d.category), formatDuration(d.avgMs), d.views])} />
          </Card>
          <Card title="Product engagement" description="Total minutes viewed per day">
            <AreaChart data={minutes} height={200} ariaLabel="Minutes of viewing per day" unit="minutes" />
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <Card className="xl:col-span-2" title="Recent activity" actions={<Link href="/admin/activity" className="text-[12px] text-a-muted hover:text-a-text">Full history →</Link>}>
            <ActivityTimeline rows={activity} compact />
          </Card>
          <Card title="Consultation requests" bodyClassName="p-0">
            {consults.length === 0 ? (
              <p className="p-5 text-[13px] text-a-muted">No requests yet.</p>
            ) : (
              <ul>
                {consults.map(({ c, clientName }) => (
                  <li key={c.id} className="border-b border-a-line px-5 py-4 last:border-0">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/admin/clients/${c.clientId}`} className="text-[13px] font-medium hover:underline">
                        {clientName}
                      </Link>
                      <Badge tone={c.status === "new" ? "gold" : "neutral"}>{c.status === "new" ? "New" : c.status}</Badge>
                    </div>
                    <p className="mt-1 text-[12px] text-a-muted">
                      {c.productIds.length} pieces · {c.preference} · {relativeTime(c.createdAt)}
                    </p>
                    {c.message && <p className="mt-2 line-clamp-2 text-[12.5px] italic text-a-text/80">“{c.message}”</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
