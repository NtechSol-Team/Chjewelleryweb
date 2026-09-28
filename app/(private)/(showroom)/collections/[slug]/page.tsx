import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireClient } from "@/lib/auth/session";
import { getClientCollection, listPieces } from "@/lib/catalogue";
import { buildFacets, parseFilters } from "@/lib/catalogue-filters";
import { logActivity } from "@/lib/activity";
import { CatalogueBrowser } from "@/components/catalogue/catalogue-browser";
import { Parallax, RevealText } from "@/components/animations/reveal";
import { StateScreen } from "@/components/showroom/state-screen";
import { ButtonLink } from "@/components/ui/button";

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) };
}

export default async function CollectionPage({ params, searchParams }: PageProps<"/collections/[slug]">) {
  const { client } = await requireClient();
  const { slug } = await params;
  const found = await getClientCollection(client.id, slug);

  // Same response whether the collection doesn't exist or isn't assigned.
  if (!found) {
    return (
      <div className="pt-[var(--header-h)]">
        <StateScreen
          label="Collection Unavailable"
          title="This collection is not part of your showroom."
          body={<p>It may have been withdrawn, or reserved for another client.</p>}
          actions={<ButtonLink href="/collections">View your collections</ButtonLink>}
        />
      </div>
    );
  }

  const { collection: c, index, next, total } = found;
  const active = parseFilters(await searchParams);
  const [all, pieces] = await Promise.all([
    listPieces(client.id, { collection: [slug] }),
    listPieces(client.id, { ...active, collection: [slug] }),
  ]);
  const filtered = active.q || active.category.length || active.gender.length || active.shape.length;
  if (!filtered) await logActivity({ actorType: "client", actorId: client.id, clientId: client.id, type: "view_collection", detail: c.name });

  return (
    <>
      <section className="relative flex h-[78svh] min-h-[520px] items-end overflow-hidden bg-ink text-ivory">
        <Parallax speed={16} className="absolute -inset-y-[8%] inset-x-0">
          <Image src={c.coverUrl!} alt="" fill priority sizes="100vw" className="object-cover" />
        </Parallax>
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-ink/40" />
        <div className="relative w-full px-gutter pb-14 md:pb-20">
          <p className="eyebrow text-soft-gold">
            Collection <span className="numeral text-sm tracking-normal">{String(index + 1).padStart(2, "0")}</span>
            <span className="text-ivory/50"> / {String(total).padStart(2, "0")}</span>
          </p>
          <RevealText
            as="h1"
            on="mount"
            delay={0.3}
            text={c.name}
            className="display mt-5 text-[3.2rem] uppercase tracking-[0.04em] sm:text-[4.8rem] lg:text-[6.8rem]"
          />
          <div className="mt-8 grid gap-6 md:grid-cols-2 md:items-end">
            <p className="font-display text-2xl italic text-ivory/85">{c.tagline}</p>
            <p className="max-w-md text-[0.92rem] leading-relaxed text-ivory/70 md:justify-self-end md:text-right">{c.description}</p>
          </div>
        </div>
      </section>

      <div className="pt-10">
        <CatalogueBrowser pieces={pieces} facets={buildFacets(all)} active={active} />
      </div>

      {next && next.slug !== c.slug && (
        <Link href={`/collections/${next.slug}`} className="group relative block h-[46vh] min-h-[320px] overflow-hidden bg-ink text-ivory">
          <Image src={next.coverUrl!} alt="" fill sizes="100vw" className="object-cover opacity-60 transition-all duration-[1600ms] ease-[var(--ease-lux)] group-hover:scale-[1.03] group-hover:opacity-75" />
          <div className="relative flex h-full flex-col items-center justify-center text-center">
            <p className="eyebrow text-[0.6rem] text-soft-gold">Next Collection</p>
            <p className="display mt-4 text-[2.6rem] uppercase tracking-[0.05em] sm:text-[4rem]">{next.name}</p>
            <ArrowRight className="mt-6 h-5 w-5 transition-transform duration-700 group-hover:translate-x-2" strokeWidth={1} />
          </div>
        </Link>
      )}
    </>
  );
}
