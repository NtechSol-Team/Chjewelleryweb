import Image from "next/image";
import Link from "next/link";
import type { ClientCollection } from "@/lib/catalogue";
import { Parallax, RevealMask, RevealText, FadeUp } from "@/components/animations/reveal";
import { LuxLink } from "@/components/ui/button";
import { SectionMark } from "@/components/ui/editorial";
import { cn } from "@/lib/cn";

export function FeaturedCollections({ collections }: { collections: ClientCollection[] }) {
  return (
    <section className="px-gutter pb-16 md:pb-28">
      <div className="flex flex-col gap-6 border-t border-line pt-10 md:flex-row md:items-end md:justify-between">
        <div>
          <SectionMark n={2} label="Curated Collections" />
          <RevealText text="Collections prepared for you" className="display mt-6 text-[2.6rem] sm:text-[3.4rem] lg:text-[4.2rem]" />
        </div>
        <LuxLink href="/collections">All collections</LuxLink>
      </div>

      <div className="mt-20 space-y-28 md:mt-28 md:space-y-44">
        {collections.map((c, i) => (
          <CollectionFeature key={c.id} collection={c} index={i} />
        ))}
      </div>
    </section>
  );
}

function CollectionFeature({ collection: c, index }: { collection: ClientCollection; index: number }) {
  const mirrored = index % 2 === 1;
  const [first, ...rest] = (c.tagline ?? "").split(". ");
  return (
    <article className="grid items-end gap-10 md:grid-cols-12 md:gap-8">
      <Link
        href={`/collections/${c.slug}`}
        className={cn("group relative block md:col-span-7", mirrored && "md:order-2 md:col-span-7 md:col-start-6")}
        aria-label={`View collection ${c.name}`}
      >
        <RevealMask className={cn("relative overflow-hidden bg-cream", mirrored ? "aspect-[5/4]" : "aspect-[4/5] md:aspect-[5/6]")} direction={mirrored ? "left" : "up"}>
          <Image
            src={c.coverUrl!}
            alt=""
            fill
            sizes="(min-width: 768px) 58vw, 100vw"
            className="object-cover transition-transform duration-[1800ms] ease-[var(--ease-lux)] group-hover:scale-[1.03]"
          />
        </RevealMask>
        <span className="absolute left-5 top-5 numeral text-sm text-ivory/90 mix-blend-difference">
          {String(index + 1).padStart(2, "0")}
        </span>
      </Link>

      <div className={cn("relative md:col-span-4", mirrored ? "md:order-1 md:col-start-1" : "md:col-start-9")}>
        {c.previews[1] && (
          <Parallax speed={22} className={cn("mb-12 hidden w-40 md:block lg:w-48", mirrored ? "ml-auto" : "")}>
            <div className="relative aspect-[3/4] overflow-hidden bg-cream">
              <Image src={c.previews[1]} alt="" fill sizes="200px" className="object-cover" />
            </div>
          </Parallax>
        )}
        <FadeUp>
          <p className="numeral text-[2.2rem] leading-none text-gold-deep">{String(index + 1).padStart(2, "0")}</p>
          <h3 className="mt-5 font-display text-[2.1rem] font-normal uppercase leading-[1.05] tracking-[0.08em] sm:text-[2.6rem]">{c.name}</h3>
          <p className="mt-5 font-display text-[1.45rem] italic leading-snug text-muted">
            {first}
            {rest.length > 0 && "."}
            {rest.length > 0 && <br />}
            {rest.join(". ")}
          </p>
          <p className="mt-6 max-w-sm text-[0.9rem] leading-relaxed text-muted">{c.description}</p>
          <div className="mt-10 flex items-center justify-between gap-6">
            <LuxLink href={`/collections/${c.slug}`}>View Collection</LuxLink>
            <span className="eyebrow text-[0.56rem] text-muted">
              <span className="numeral text-sm tracking-normal">{c.pieceCount}</span> {c.pieceCount === 1 ? "piece" : "pieces"}
            </span>
          </div>
        </FadeUp>
      </div>
    </article>
  );
}
