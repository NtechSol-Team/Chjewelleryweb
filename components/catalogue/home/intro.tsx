import { RevealText, FadeUp } from "@/components/animations/reveal";
import { SectionMark } from "@/components/ui/editorial";

export function Intro({ advisor, name, collections, pieces }: { advisor: string | null; name: string; collections: number; pieces: number }) {
  return (
    <section className="px-gutter py-28 md:py-40">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[14rem_1fr] lg:gap-20">
        <FadeUp>
          <SectionMark n={1} label="A Private Presentation" />
        </FadeUp>
        <div>
          <RevealText
            as="p"
            text={`Every piece in this showroom has been selected for ${name}. Take your time — shortlist what speaks to you, and we will arrange a private viewing.`}
            className="display text-[1.95rem] leading-[1.22] text-charcoal sm:text-[2.6rem] lg:text-[3.2rem]"
            stagger={0.025}
          />
          <FadeUp delay={0.3} className="mt-14 flex flex-wrap items-end gap-x-16 gap-y-8 border-t border-line pt-8">
            <Stat value={collections} label={collections === 1 ? "Collection" : "Collections"} />
            <Stat value={pieces} label="Pieces" />
            {advisor && (
              <div className="ml-auto text-right">
                <p className="eyebrow text-[0.58rem] text-muted">Presented by</p>
                <p className="mt-2 font-display text-2xl italic">{advisor}</p>
              </div>
            )}
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="numeral text-5xl text-charcoal">{String(value).padStart(2, "0")}</p>
      <p className="mt-2 eyebrow text-[0.58rem] text-muted">{label}</p>
    </div>
  );
}
