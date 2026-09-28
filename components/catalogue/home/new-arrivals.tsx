import type { PieceCard as Piece } from "@/lib/catalogue";
import { PieceCard } from "@/components/catalogue/piece-card";
import { RevealText, FadeUp } from "@/components/animations/reveal";
import { SectionMark } from "@/components/ui/editorial";
import { LuxLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function NewArrivals({ pieces }: { pieces: Piece[] }) {
  return (
    <section className="px-gutter py-28 md:py-40">
      <div className="grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+3rem)]">
            <SectionMark n={4} label="New Arrivals" />
            <RevealText text={"Recently added\nto your showroom"} className="display mt-6 text-[2.5rem] leading-[1.05] sm:text-[3.2rem]" />
            <FadeUp className="mt-8 max-w-xs text-[0.92rem] leading-relaxed text-muted">
              <p>New pieces are added to your private catalogue as they leave the atelier. They are shown to you before anyone else.</p>
            </FadeUp>
            <FadeUp delay={0.2} className="mt-10">
              <LuxLink href="/new-arrivals">View new arrivals</LuxLink>
            </FadeUp>
          </div>
        </div>
        <ul className="grid gap-x-8 gap-y-16 xs:grid-cols-2 lg:col-span-8">
          {pieces.map((p, i) => (
            <FadeUp as="li" key={p.id} delay={(i % 2) * 0.12} className={cn(i % 2 === 1 && "xs:mt-24")}>
              <PieceCard piece={p} sizes="(min-width:1024px) 30vw, 48vw" />
            </FadeUp>
          ))}
        </ul>
      </div>
    </section>
  );
}
