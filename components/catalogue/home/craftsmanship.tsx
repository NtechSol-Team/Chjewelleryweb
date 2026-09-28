import Image from "next/image";
import { Parallax, RevealMask, RevealText, FadeUp } from "@/components/animations/reveal";
import { SectionMark } from "@/components/ui/editorial";

export function Craftsmanship({ images }: { images: [string, string] }) {
  return (
    <section className="overflow-hidden bg-charcoal px-gutter py-28 text-ivory md:py-40">
      <div className="grid items-center gap-16 lg:grid-cols-12">
        <div className="relative lg:col-span-7">
          <RevealMask className="relative aspect-[4/3] overflow-hidden bg-ink">
            <Image src={images[0]} alt="A setter's hands placing a diamond" fill sizes="(min-width:1024px) 55vw, 100vw" className="object-cover" />
          </RevealMask>
          <Parallax speed={30} className="absolute -bottom-16 right-4 w-[38%] md:right-[-6%]">
            <div className="relative aspect-[3/4] overflow-hidden border-8 border-charcoal bg-ink">
              <Image src={images[1]} alt="Polishing a ring at the bench" fill sizes="20vw" className="object-cover" />
            </div>
          </Parallax>
        </div>
        <div className="lg:col-span-4 lg:col-start-9">
          <SectionMark n={5} label="The Atelier" tone="light" />
          <RevealText text={"Made by hand,\none stone at a time."} className="display mt-6 text-[2.5rem] leading-[1.06] sm:text-[3.2rem]" />
          <FadeUp className="mt-8 space-y-5 text-[0.95rem] leading-relaxed text-ivory/70">
            <p>
              Every CH Jewels piece passes through the hands of a single master setter, from the first wax model to the final polish.
            </p>
            <p>A ring may take three weeks. A rivière, several months. Nothing is hurried.</p>
          </FadeUp>
          <FadeUp delay={0.2} className="mt-12 grid grid-cols-3 gap-6 border-t border-ivory/15 pt-8">
            {[
              ["40+", "Years at the bench"],
              ["1 in 40", "Stones selected"],
              ["GIA", "Certified diamonds"],
            ].map(([v, l]) => (
              <div key={l}>
                <p className="numeral text-2xl text-soft-gold">{v}</p>
                <p className="mt-2 eyebrow text-[0.52rem] text-ivory/60">{l}</p>
              </div>
            ))}
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
