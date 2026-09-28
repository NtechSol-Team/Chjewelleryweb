import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, count, eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { formatDuration, relativeTime } from "@/lib/format";
import { PageHeader, Card, ALink, Badge } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { MediaManager } from "@/components/admin/media-manager";

export const metadata: Metadata = { title: "Edit product" };

export default async function ProductEditPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [p] = await db.select().from(schema.products).where(eq(schema.products.id, id)).limit(1);
  if (!p) notFound();

  const [collections, media, [stats], viewers] = await Promise.all([
    db.select({ id: schema.collections.id, name: schema.collections.name }).from(schema.collections).orderBy(asc(schema.collections.sortOrder)),
    db.select().from(schema.productMedia).where(eq(schema.productMedia.productId, id)).orderBy(asc(schema.productMedia.sortOrder)),
    db
      .select({ views: count(), ms: sql<number>`coalesce(sum(${schema.productViews.durationMs}),0)::bigint`.mapWith(Number), last: sql<Date | null>`max(${schema.productViews.startedAt})` })
      .from(schema.productViews)
      .where(eq(schema.productViews.productId, id)),
    db.execute<{ id: string; name: string; views: number }>(sql`
      select c.id, concat_ws(' ', c.salutation, c.first_name, c.last_name) as name, count(v.id)::int as views
      from product_views v join clients c on c.id = v.client_id
      where v.product_id = ${id} group by c.id order by views desc limit 6`),
  ]);

  return (
    <>
      <PageHeader
        eyebrow={`Products · ${p.code}`}
        title={p.name}
        description={<Badge tone={p.status === "published" ? "ok" : p.status === "draft" ? "neutral" : "warn"}>{p.status[0].toUpperCase() + p.status.slice(1)}</Badge>}
        actions={<ALink href="/admin/products">Back to products</ALink>}
      />
      {created === "1" && <p className="mx-5 mt-5 rounded-md border border-ok/30 bg-ok-soft px-4 py-3 text-[13px] text-ok md:mx-8">Product created. Add 4–5 images, and optionally a film and 360° frames.</p>}
      <div className="grid gap-5 p-5 md:p-8 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card title="Media" description="Images, film and 360° view. Stored privately and served only to entitled clients.">
            <MediaManager productId={p.id} media={media} />
          </Card>
          <Card title="Details">
            <ProductForm productId={p.id} collections={collections} initial={p} />
          </Card>
        </div>
        <div className="space-y-5">
          <Card title="Engagement">
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-[12px] text-a-muted">Views</dt>
                <dd className="mt-1 text-[22px] font-semibold">{stats.views}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-a-muted">Viewing time</dt>
                <dd className="mt-1 text-[22px] font-semibold">{formatDuration(stats.ms)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[12px] text-a-muted">Last viewed {relativeTime(stats.last)}</p>
            <ul className="mt-4 space-y-2 border-t border-a-line pt-4">
              {viewers.map((v) => (
                <li key={v.id} className="flex justify-between text-[13px]">
                  <Link href={`/admin/clients/${v.id}`} className="hover:underline">{v.name}</Link>
                  <span className="tabular text-a-muted">{v.views} views</span>
                </li>
              ))}
              {!viewers.length && <li className="text-[13px] text-a-muted">Not viewed yet.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
