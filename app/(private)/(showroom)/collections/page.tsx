import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireClient } from "@/lib/auth/session";
import { listClientCollections } from "@/lib/catalogue";
import { RevealMask, RevealText, FadeUp } from "@/components/animations/reveal";
import { EmptyState } from "@/components/ui/editorial";
import { LuxLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const { client } = await requireClient();
  const collections = await listClientCollections(client.id);

  return (
    <>
      <section className="px-gutter pb-16 pt-[calc(var(--header-h)+3.5rem)] md:pb-24 md:pt-[calc(var(--header-h)+6rem)]">
        <p className="eyebrow text-gold-deep">Curated Selection</p>
        <RevealText as="h1" on="mount" text="Collections" className="display mt-5 text-[3.4rem] sm:text-[4.6rem] lg:text-[6.5rem]" />
        <p className="mt-6 max-w-lg font-display text-xl italic leading-snug text-muted">
          {collections.length} {collections.length === 1 ? "collection has" : "collections have"} been opened for your private viewing.
        </p>
      </section>

      {collections.length === 0 ? (
        <EmptyState className="px-gutter" title="No collection available" body="Your private catalogue is currently being prepared." />
      ) : (
        <ol className="border-t border-line">
          {collections.map((c, i) => (
            <li key={c.id} className="border-b border-line">
              <Link href={`/collections/${c.slug}`} className="group grid items-center gap-8 px-gutter py-12 md:grid-cols-12 md:py-16">
                <FadeUp className={cn("md:col-span-5", i % 2 === 1 && "md:order-2 md:col-start-8")}>
                  <p className="numeral text-lg text-gold-deep">{String(i + 1).padStart(2, "0")}</p>
                  <h2 className="mt-4 font-display text-[2.4rem] uppercase leading-[1.02] tracking-[0.06em] transition-colors duration-700 group-hover:text-gold-deep sm:text-[3.2rem]">
                    {c.name}
                  </h2>
                  <p className="mt-4 font-display text-xl italic text-muted">{c.tagline}</p>
                  <div className="mt-10 flex items-center gap-8">
                    <span className="lux-link eyebrow text-[0.64rem]">
                      <span>View Collection</span>
                      <span className="lux-line" />
                    </span>
                    <span className="eyebrow text-[0.56rem] text-muted">
                      <span className="numeral text-sm tracking-normal">{c.pieceCount}</span> pieces
                    </span>
                  </div>
                </FadeUp>
                <div className={cn("grid grid-cols-5 gap-3 md:col-span-6", i % 2 === 1 ? "md:order-1 md:col-start-1" : "md:col-start-7")}>
                  <RevealMask className="relative col-span-3 aspect-[4/5] overflow-hidden bg-cream">
                    <Image
                      src={c.coverUrl!}
                      alt=""
                      fill
                      sizes="(min-width:768px) 30vw, 60vw"
                      className="object-cover transition-transform duration-[1800ms] ease-[var(--ease-lux)] group-hover:scale-[1.04]"
                    />
                  </RevealMask>
                  <div className="col-span-2 flex flex-col gap-3 pt-12">
                    {c.previews.slice(0, 2).map((src, k) => (
                      <RevealMask key={k} delay={0.15 * (k + 1)} className="relative aspect-square overflow-hidden bg-cream">
                        <Image src={src} alt="" fill sizes="18vw" className="object-cover" />
                      </RevealMask>
                    ))}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
      <div className="px-gutter py-20 text-center">
        <LuxLink href="/jewellery">Browse all pieces</LuxLink>
      </div>
    </>
  );
}
