import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Film, Rotate3d } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { mediaLibrary } from "@/lib/admin/queries";
import { PageHeader, Badge } from "@/components/admin/ui";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Media" };

const TABS = [
  { k: "", label: "All" },
  { k: "image", label: "Images" },
  { k: "video", label: "Films" },
  { k: "spin", label: "360° views" },
];

export default async function MediaPage({ searchParams }: PageProps<"/admin/media">) {
  await requireAdmin();
  const { kind } = await searchParams;
  const k = typeof kind === "string" ? kind : "";
  const rows = await mediaLibrary(k || undefined);

  return (
    <>
      <PageHeader title="Media" description="Every image, film and 360° sequence across the catalogue. Upload and reorder from a product's page." />
      <div className="p-5 md:p-8">
        <nav className="mb-5 flex gap-1 border-b border-a-line" aria-label="Media type">
          {TABS.map((t) => (
            <Link key={t.k} href={t.k ? `/admin/media?kind=${t.k}` : "/admin/media"} aria-current={k === t.k ? "page" : undefined} className={cn("-mb-px border-b-2 px-3 py-2 text-[13px]", k === t.k ? "border-charcoal font-medium" : "border-transparent text-a-muted hover:text-a-text")}>
              {t.label}
            </Link>
          ))}
          <span className="ml-auto self-center text-[12px] text-a-muted">{rows.length} items</span>
        </nav>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-7">
          {rows.map(({ m, code, name, productId }) => (
            <li key={m.id} className="overflow-hidden rounded-md border border-a-line bg-white">
              <Link href={`/admin/products/${productId}`} className="group block">
                <span className="relative block aspect-square bg-cream">
                  {m.kind === "video" ? (
                    m.posterUrl && <Image src={m.posterUrl} alt="" fill sizes="200px" className="object-cover" unoptimized />
                  ) : (
                    <Image src={m.url} alt={m.alt ?? ""} fill sizes="200px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  )}
                  {m.kind !== "image" && (
                    <span className="absolute left-2 top-2">
                      <Badge dot={false}>{m.kind === "video" ? <><Film className="h-3 w-3" /> Film</> : <><Rotate3d className="h-3 w-3" /> {m.frames?.length} frames</>}</Badge>
                    </span>
                  )}
                </span>
                <span className="block px-2.5 py-2">
                  <span className="block text-[12px] font-semibold">{code}</span>
                  <span className="block truncate text-[11.5px] text-a-muted">{m.alt?.split("— ")[1] ?? name}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
