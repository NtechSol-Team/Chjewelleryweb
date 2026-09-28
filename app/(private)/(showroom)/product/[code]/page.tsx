import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { requireClient, clientDisplayName } from "@/lib/auth/session";
import { getPiece, listPieces } from "@/lib/catalogue";
import { categoryLabel, categorySingular, genderLabel, shapeLabel } from "@/lib/taxonomy";
import { PieceGallery } from "@/components/product/piece-gallery";
import { ViewTracker } from "@/components/product/view-tracker";
import { MobilePieceBar } from "@/components/product/mobile-piece-bar";
import { ShortlistCTA } from "@/components/catalogue/shortlist-button";
import { PieceCard } from "@/components/catalogue/piece-card";
import { StateScreen } from "@/components/showroom/state-screen";
import { Parallax, RevealMask, FadeUp, RevealText } from "@/components/animations/reveal";
import { Spec, SectionMark } from "@/components/ui/editorial";
import { ButtonLink, LuxLink } from "@/components/ui/button";

export async function generateMetadata({ params }: PageProps<"/product/[code]">): Promise<Metadata> {
  const { code } = await params;
  return { title: code.toUpperCase() };
}

export default async function PiecePage({ params }: PageProps<"/product/[code]">) {
  const { client, session } = await requireClient();
  const { code } = await params;
  const piece = await getPiece(client.id, decodeURIComponent(code).toUpperCase());

  // Unknown and unassigned pieces are indistinguishable to the client.
  if (!piece) {
    return (
      <div className="pt-[var(--header-h)]">
        <StateScreen
          label="Piece Unavailable"
          title="This piece is not part of your private catalogue."
          body={<p>It may have been withdrawn, or reserved for another client. Your advisor will be glad to help.</p>}
          actions={<ButtonLink href="/jewellery">Return to your catalogue</ButtonLink>}
        />
      </div>
    );
  }

  const all = await listPieces(client.id);
  const pos = all.findIndex((p) => p.id === piece.id);
  const prev = all[(pos - 1 + all.length) % all.length];
  const next = all[(pos + 1) % all.length];
  const related = all.filter((p) => p.id !== piece.id && p.collection?.slug === piece.collection?.slug).slice(0, 4);
  const details = piece.media.filter((m) => m.kind === "image").slice(1, 3);

  const facts = [
    { label: "Reference", value: piece.code },
    { label: "Category", value: categorySingular(piece.category) },
    ...(piece.shape ? [{ label: "Shape", value: shapeLabel(piece.shape) }] : []),
    { label: "For", value: genderLabel(piece.gender) },
    ...piece.specifications,
  ];

  return (
    <>
      <ViewTracker productId={piece.id} code={piece.code} />

      <section className="px-gutter pb-20 pt-[calc(var(--header-h)+1.5rem)] lg:pt-[calc(var(--header-h)+2.5rem)]">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-3 eyebrow text-[0.56rem] text-muted lg:mb-8">
          <Link href="/collections" className="hover:text-charcoal">
            Collections
          </Link>
          <span className="h-px w-4 bg-line" />
          {piece.collection && (
            <>
              <Link href={`/collections/${piece.collection.slug}`} className="hover:text-charcoal">
                {piece.collection.name}
              </Link>
              <span className="h-px w-4 bg-line" />
            </>
          )}
          <span className="text-charcoal">{piece.code}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-20">
          <div className="lg:col-span-7">
            <PieceGallery media={piece.media} code={piece.code} name={piece.name} />
          </div>

          <aside className="lg:col-span-5 xl:col-span-4 xl:col-start-9">
            <div className="lg:sticky lg:top-[calc(var(--header-h)+2.5rem)]">
              <p className="eyebrow text-[0.62rem] text-muted">Product Code</p>
              <p className="mt-2 font-sans text-[1.05rem] font-medium tracking-[0.3em] text-gold-deep">{piece.code}</p>
              <RevealText as="h1" on="mount" text={piece.name} className="display mt-6 text-[2.6rem] leading-[1.02] sm:text-[3.2rem] xl:text-[3.6rem]" />
              <p className="mt-5 eyebrow text-[0.6rem] text-muted">
                {categoryLabel(piece.category)}
                {piece.collection && <> · {piece.collection.name}</>}
                {piece.isNew && <span className="ml-3 text-gold-deep">New</span>}
              </p>

              <span className="mt-8 block h-px w-16 bg-champagne" />

              {piece.description && <p className="mt-8 font-display text-[1.35rem] leading-[1.5] text-charcoal/85">{piece.description}</p>}

              <div className="mt-10 hidden lg:block">
                <ShortlistCTA id={piece.id} code={piece.code} />
                <div className="mt-5 flex items-center justify-between">
                  <LuxLink href="/shortlist">Request a private viewing</LuxLink>
                </div>
              </div>

              <div id="details" className="scroll-mt-28">
                <p className="mt-12 eyebrow text-[0.62rem] text-charcoal">Selected Specifications</p>
                <dl className="mt-4 border-y border-line">
                  {facts.map((f) => (
                    <Spec key={f.label} label={f.label} value={f.value} />
                  ))}
                </dl>
              </div>

              <div className="mt-6 lg:hidden">
                <ShortlistCTA id={piece.id} code={piece.code} />
              </div>

              <div className="mt-10 flex items-start gap-4 bg-cream/70 p-5">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" strokeWidth={1.2} />
                <div>
                  <p className="eyebrow text-[0.56rem] text-charcoal">Private Viewing</p>
                  <p className="mt-2 text-[0.8rem] leading-relaxed text-muted">
                    Presented privately for {clientDisplayName(client)}. Imagery is watermarked to session{" "}
                    <span className="font-medium text-charcoal">{session.id.slice(0, 8).toUpperCase()}</span>.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {details.length === 2 && (
        <section className="bg-pearl px-gutter py-24 md:py-36">
          <div className="grid items-start gap-6 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-4">
              <SectionMark n="—" label="In Detail" />
              <RevealText text={"Closer than\nthe eye allows."} className="display mt-6 text-[2.4rem] leading-[1.05] sm:text-[3rem]" />
              <FadeUp className="mt-6 max-w-xs text-[0.9rem] leading-relaxed text-muted">
                <p>Macro views of the setting and stone, photographed under controlled north light.</p>
              </FadeUp>
            </div>
            <div className="md:col-span-4">
              <RevealMask className="relative aspect-[4/5] overflow-hidden bg-cream">
                <Image src={details[0].url} alt={details[0].alt ?? ""} fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover" />
              </RevealMask>
              <p className="mt-4 caption text-muted">{details[0].alt?.split("— ")[1] ?? "Detail"}</p>
            </div>
            <Parallax speed={20} className="md:col-span-4 md:mt-32">
              <RevealMask className="relative aspect-[4/5] overflow-hidden bg-cream" delay={0.15}>
                <Image src={details[1].url} alt={details[1].alt ?? ""} fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover" />
              </RevealMask>
              <p className="mt-4 caption text-muted">{details[1].alt?.split("— ")[1] ?? "Detail"}</p>
            </Parallax>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="px-gutter py-24 md:py-32">
          <div className="flex items-end justify-between gap-6">
            <div>
              <SectionMark n="—" label="From the same collection" />
              <h2 className="display mt-5 text-[2.3rem] sm:text-[3rem]">{piece.collection?.name}</h2>
            </div>
            {piece.collection && (
              <LuxLink href={`/collections/${piece.collection.slug}`} className="hidden sm:inline-flex">
                View collection
              </LuxLink>
            )}
          </div>
          <ul className="mt-14 grid gap-x-6 gap-y-14 xs:grid-cols-2 lg:grid-cols-4">
            {related.map((p, i) => (
              <FadeUp as="li" key={p.id} delay={i * 0.08}>
                <PieceCard piece={p} sizes="(min-width:1024px) 23vw, 48vw" />
              </FadeUp>
            ))}
          </ul>
        </section>
      )}

      {all.length > 1 && (
        <nav aria-label="Browse pieces" className="grid grid-cols-2 border-t border-line">
          <Link href={`/product/${prev.code}`} className="group flex items-center gap-5 px-gutter py-10 transition-colors hover:bg-pearl">
            <ArrowLeft className="h-4 w-4 shrink-0 transition-transform duration-700 group-hover:-translate-x-1.5" strokeWidth={1.1} />
            <span className="min-w-0">
              <span className="eyebrow block text-[0.56rem] text-muted">Previous · {prev.code}</span>
              <span className="mt-1 block truncate font-display text-xl sm:text-2xl">{prev.name}</span>
            </span>
          </Link>
          <Link href={`/product/${next.code}`} className="group flex items-center justify-end gap-5 border-l border-line px-gutter py-10 text-right transition-colors hover:bg-pearl">
            <span className="min-w-0">
              <span className="eyebrow block text-[0.56rem] text-muted">Next · {next.code}</span>
              <span className="mt-1 block truncate font-display text-xl sm:text-2xl">{next.name}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-700 group-hover:translate-x-1.5" strokeWidth={1.1} />
          </Link>
        </nav>
      )}

      <MobilePieceBar id={piece.id} code={piece.code} />
      <div className="h-14 lg:hidden" aria-hidden />
    </>
  );
}
