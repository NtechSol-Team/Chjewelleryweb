"use client";

import { useRef } from "react";
import type { PieceCard as Piece } from "@/lib/catalogue";
import { gsap, useGSAP } from "@/lib/gsap";
import { PieceCard } from "@/components/catalogue/piece-card";
import { SectionMark } from "@/components/ui/editorial";
import { LuxLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Horizontal gallery. On large screens the section pins and vertical scroll
 * drives the rail sideways; on touch devices it is a native snap carousel.
 */
export function SignatureRail({ pieces }: { pieces: Piece[] }) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const el = track.current!;
        const distance = () => el.scrollWidth - window.innerWidth;
        gsap.to(el, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => bar.current && gsap.set(bar.current, { scaleX: self.progress }),
          },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const onNativeScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const t = e.currentTarget;
    if (window.innerWidth >= 1024 || !bar.current) return;
    bar.current.style.transform = `scaleX(${t.scrollLeft / Math.max(1, t.scrollWidth - t.clientWidth)})`;
  };

  return (
    <section ref={root} className="relative overflow-hidden bg-pearl py-20 lg:flex lg:h-screen lg:flex-col lg:justify-center lg:py-0">
      <div className="flex items-end justify-between gap-6 px-gutter">
        <div>
          <SectionMark n={3} label="Signature Pieces" />
          <h2 className="display mt-6 text-[2.5rem] sm:text-[3.2rem] lg:text-[3.8rem]">
            Presented in <span className="italic">motion</span>
          </h2>
        </div>
        <LuxLink href="/jewellery" className="hidden sm:inline-flex">
          View all pieces
        </LuxLink>
      </div>

      <div
        onScroll={onNativeScroll}
        className="no-scrollbar mt-12 snap-x snap-mandatory overflow-x-auto lg:mt-14 lg:snap-none lg:overflow-visible"
      >
        <div ref={track} className="flex w-max gap-6 px-gutter will-change-transform md:gap-10 lg:gap-14">
          {pieces.map((p, i) => (
            <div key={p.id} className={cn("w-[72vw] shrink-0 snap-start xs:w-[58vw] md:w-[38vw] lg:w-[25vw] 3xl:w-[22vw]", i % 2 === 1 && "lg:mt-16")}>
              <PieceCard piece={p} ratio={i % 2 === 1 ? "square" : "portrait"} sizes="(min-width:1024px) 25vw, 70vw" />
            </div>
          ))}
          <div className="flex w-[50vw] shrink-0 snap-start items-center justify-center md:w-[30vw] lg:w-[22vw]">
            <LuxLink href="/jewellery" className="font-display text-2xl normal-case tracking-normal">
              Continue to the catalogue
            </LuxLink>
          </div>
        </div>
      </div>

      <div className="mt-12 px-gutter lg:mt-16">
        <div className="relative h-px w-full bg-line" aria-hidden>
          <span ref={bar} className="absolute inset-0 origin-left scale-x-0 bg-champagne" />
        </div>
      </div>
    </section>
  );
}
