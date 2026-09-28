import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Film, Plus, Rotate3d, Search } from "lucide-react";
import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { productsAdmin } from "@/lib/admin/queries";
import { CATEGORIES, categoryLabel } from "@/lib/taxonomy";
import { relativeTime } from "@/lib/format";
import { PageHeader, ALink, Badge, Th, Td, EmptyPanel, inputClass, AButton, inlineInput } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Products" };

const STATUS_TONE = { published: "ok", draft: "neutral", archived: "warn" } as const;

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const f = { q: str("q"), category: str("category"), status: str("status"), collection: str("collection") };
  const [rows, collections] = await Promise.all([
    productsAdmin({ q: f.q || undefined, category: f.category || undefined, status: f.status || undefined, collection: f.collection || undefined }),
    db.select().from(schema.collections).orderBy(asc(schema.collections.sortOrder)),
  ]);

  return (
    <>
      <PageHeader
        title="Products"
        description={`${rows.length} pieces${Object.values(f).some(Boolean) ? " match your filters" : " in the library"}`}
        actions={
          <ALink href="/admin/products/new" variant="primary">
            <Plus className="h-4 w-4" /> New product
          </ALink>
        }
      />
      <div className="p-5 md:p-8">
        <form className="mb-4 flex flex-wrap items-center gap-2" role="search">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-a-muted" />
            <input name="q" defaultValue={f.q} placeholder="Code or name" className={`${inputClass} pl-8`} aria-label="Search products" />
          </div>
          <select name="category" defaultValue={f.category} className={`${inlineInput} w-auto`} aria-label="Category">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label} ({c.code})
              </option>
            ))}
          </select>
          <select name="collection" defaultValue={f.collection} className={`${inlineInput} w-auto`} aria-label="Collection">
            <option value="">All collections</option>
            {collections.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={f.status} className={`${inlineInput} w-auto`} aria-label="Status">
            <option value="">Any status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <AButton type="submit">Apply</AButton>
          {Object.values(f).some(Boolean) && (
            <Link href="/admin/products" className="text-[12.5px] text-a-muted hover:text-a-text">
              Clear
            </Link>
          )}
        </form>

        {rows.length === 0 ? (
          <div className="rounded-md border border-a-line bg-white">
            <EmptyPanel title="No products found" body="Adjust the filters or create a new piece." />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-md border border-a-line bg-white md:block">
              <table className="w-full min-w-[980px] border-collapse">
                <thead>
                  <tr>
                    <Th>Product</Th>
                    <Th>Category</Th>
                    <Th>Collection</Th>
                    <Th>Media</Th>
                    <Th>Status</Th>
                    <Th align="right">Clients</Th>
                    <Th align="right">Views</Th>
                    <Th>Updated</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ p, collection, cover, images, hasVideo, hasSpin, views, clients }) => (
                    <tr key={p.id} className="hover:bg-a-subtle/50">
                      <Td>
                        <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                          <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded bg-cream">{cover && <Image src={cover} alt="" fill sizes="40px" className="object-cover" />}</span>
                          <span>
                            <span className="block text-[12px] font-semibold tracking-wide">{p.code}</span>
                            <span className="block text-[13px] hover:underline">{p.name}</span>
                          </span>
                        </Link>
                      </Td>
                      <Td>
                        {categoryLabel(p.category)} <span className="text-[11.5px] text-a-muted">· {p.gender === "MALE" ? "Men" : "Women"}</span>
                      </Td>
                      <Td className="text-a-muted">{collection ?? "—"}</Td>
                      <Td>
                        <span className="flex items-center gap-2 text-[12px] text-a-muted">
                          {images} img
                          {hasVideo && <Film className="h-3.5 w-3.5" aria-label="Has film" />}
                          {hasSpin && <Rotate3d className="h-3.5 w-3.5" aria-label="Has 360° view" />}
                          {images < 4 && <Badge tone="warn" dot={false}>Needs images</Badge>}
                        </span>
                      </Td>
                      <Td>
                        <Badge tone={STATUS_TONE[p.status]}>{p.status[0].toUpperCase() + p.status.slice(1)}</Badge>
                        {p.isNew && <Badge tone="gold" dot={false} className="ml-1">New</Badge>}
                      </Td>
                      <Td align="right">{clients}</Td>
                      <Td align="right">{views}</Td>
                      <Td className="text-a-muted">{relativeTime(p.updatedAt)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="grid grid-cols-2 gap-3 md:hidden">
              {rows.map(({ p, cover, views }) => (
                <li key={p.id} className="overflow-hidden rounded-md border border-a-line bg-white">
                  <Link href={`/admin/products/${p.id}`}>
                    <span className="relative block aspect-square bg-cream">{cover && <Image src={cover} alt="" fill sizes="50vw" className="object-cover" />}</span>
                    <span className="block p-3">
                      <span className="block text-[12px] font-semibold">{p.code}</span>
                      <span className="block truncate text-[12.5px]">{p.name}</span>
                      <span className="mt-1.5 flex items-center justify-between">
                        <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
                        <span className="text-[11.5px] text-a-muted">{views} views</span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
