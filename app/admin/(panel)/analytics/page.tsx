import type { Metadata } from "next";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { Download } from "lucide-react";
import { requireAdmin, clientDisplayName } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { viewingTable, viewsByDay } from "@/lib/admin/queries";
import { formatDuration, relativeTime } from "@/lib/format";
import { PageHeader, Card, AButton, Badge, Th, Td, StatTile, inlineInput } from "@/components/admin/ui";
import { AreaChart } from "@/components/admin/charts";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  await requireAdmin();
  const sp = await searchParams;
  const s = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const f = { client: s("client"), collection: s("collection"), product: s("product"), days: Number(s("days")) || 30 };

  const [clients, collections, rows, series] = await Promise.all([
    db.select().from(schema.clients).orderBy(asc(schema.clients.lastName)),
    db.select().from(schema.collections).orderBy(asc(schema.collections.sortOrder)),
    viewingTable({ clientId: f.client || undefined, collection: f.collection || undefined, productQ: f.product || undefined, sinceDays: f.days }),
    viewsByDay(f.days, f.client || undefined),
  ]);
  const totalViews = rows.reduce((a, r) => a + r.views, 0);
  const totalMs = rows.reduce((a, r) => a + r.ms, 0);
  const qs = new URLSearchParams(Object.entries({ client: f.client, collection: f.collection, product: f.product, days: String(f.days) }).filter(([, v]) => v)).toString();
  const shortDay = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <>
      <PageHeader
        title="Engagement Analytics"
        description="Who viewed what, when, how often and for how long."
        actions={
          <a href={`/api/admin/analytics.csv?${qs}`} className="inline-flex h-9 items-center gap-2 rounded-md border border-a-line bg-white px-3.5 text-[13px] font-medium hover:bg-a-subtle">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </a>
        }
      />
      <div className="space-y-5 p-5 md:p-8">
        <form className="flex flex-wrap items-center gap-2">
          <select name="days" defaultValue={String(f.days)} className={`${inlineInput} w-auto`} aria-label="Date range">
            <option value="1">Today</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <select name="client" defaultValue={f.client} className={`${inlineInput} w-auto`} aria-label="Client">
            <option value="">All clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{clientDisplayName(c)}</option>
            ))}
          </select>
          <select name="collection" defaultValue={f.collection} className={`${inlineInput} w-auto`} aria-label="Collection">
            <option value="">All collections</option>
            {collections.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <input name="product" defaultValue={f.product} placeholder="Product code or name" className={`${inlineInput} w-48`} aria-label="Product" />
          <AButton type="submit">Apply</AButton>
          {qs !== "days=30" && qs !== "" && <Link href="/admin/analytics" className="text-[12.5px] text-a-muted hover:text-a-text">Reset</Link>}
        </form>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatTile label="Views" value={totalViews} />
          <StatTile label="Viewing time" value={formatDuration(totalMs)} />
          <StatTile label="Client · piece pairs" value={rows.length} />
          <StatTile label="Avg. time per view" value={totalViews ? formatDuration(totalMs / totalViews) : "—"} />
        </div>

        {!f.collection && !f.product && (
          <Card title="Views over time" description={f.client ? "For the selected client" : "All clients"}>
            <AreaChart height={200} data={series.map((d) => ({ label: shortDay(d.day), value: d.views }))} ariaLabel="Views over time for current filters" />
          </Card>
        )}

        <Card title="Client viewing detail" description={`${rows.length} rows · sorted by most recent`} bodyClassName="p-0">
          <div className="hidden max-h-[640px] overflow-auto md:block">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr>
                  <Th>Client</Th>
                  <Th>Product</Th>
                  <Th align="right">Views</Th>
                  <Th align="right">View time</Th>
                  <Th>Last viewed</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.clientId + r.productId} className="hover:bg-a-subtle/50">
                    <Td><Link href={`/admin/clients/${r.clientId}`} className="font-medium hover:underline">{r.clientName}</Link></Td>
                    <Td>
                      <Link href={`/admin/products/${r.productId}`} className="hover:underline"><span className="font-medium">{r.code}</span> <span className="text-a-muted">{r.name}</span></Link>
                    </Td>
                    <Td align="right">{r.views}</Td>
                    <Td align="right">{formatDuration(r.ms)}</Td>
                    <Td className="text-a-muted">{relativeTime(r.lastViewed)}</Td>
                    <Td>{r.discussed ? <Badge tone="gold">Discussed</Badge> : r.shortlisted ? <Badge tone="gold" dot={false}>♡ Shortlisted</Badge> : <Badge>Viewed</Badge>}</Td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><Td className="py-10 text-center text-a-muted">No viewing matches these filters.</Td></tr>
                )}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-a-line md:hidden">
            {rows.slice(0, 60).map((r) => (
              <li key={r.clientId + r.productId} className="px-4 py-3">
                <div className="flex justify-between gap-2 text-[13px]">
                  <span className="font-medium">{r.clientName}</span>
                  <span className="tabular">{formatDuration(r.ms)}</span>
                </div>
                <p className="text-[12.5px] text-a-muted">{r.code} · {r.name}</p>
                <p className="mt-1 text-[12px] text-a-muted">{r.views} views · {relativeTime(r.lastViewed)} {r.shortlisted && "· ♡"}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
