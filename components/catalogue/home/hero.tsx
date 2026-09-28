"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { ButtonLink } from "@/components/ui/button";

export function Hero({ image, pieceCount, name }: { image: string; pieceCount: number; name: string }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set("[data-h]", { opacity: 1, y: 0 });
        return;
      }
      const tl = gsap.timeline({ delay: 0.35 });
      tl.fromTo("[data-h-photo]", { scale: 1.24 }, { scale: 1.06, duration: 3.6, ease: "expo.out" })
        .fromTo("[data-h-line]", { yPercent: 110 }, { yPercent: 0, duration: 1.5, stagger: 0.12, ease: "expo.out" }, 0.5)
        .fromTo("[data-h]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.3, stagger: 0.1, ease: "expo.out" }, 0.9);

      // Foreground and background travel at different speeds on scroll.
      gsap.to("[data-h-media]", {
        yPercent: 16,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.5 },
      });
      gsap.to("[data-h-copy]", {
        yPercent: -30,
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "70% top", scrub: 0.5 },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative h-[88svh] min-h-[560px] overflow-hidden bg-ink text-ivory md:h-[86vh]">
      {/* On wide screens the photograph sits right so the headline has its own dark field. */}
      <div data-h-media className="absolute inset-0 will-change-transform lg:left-[36%]">
        <div data-h-photo className="absolute inset-0 will-change-transform">
          <Image src={image} alt="A diamond ring in a single beam of light" fill priority sizes="100vw" className="object-cover object-[60%_50%] md:object-center" />
        </div>
        <div className="absolute inset-y-0 left-0 hidden w-1/3 bg-gradient-to-r from-ink to-transparent lg:block" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/20 to-transparent" />
      <div className="absolute inset-0 bg-ink/30 lg:hidden" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/70 to-transparent" />

      <div data-h-copy className="relative flex h-full flex-col justify-end px-gutter pb-14 md:pb-20">
        <p data-h className="eyebrow text-soft-gold opacity-0">
          Private Collection
        </p>
        <h1 className="display mt-6 text-[3.1rem] leading-[0.98] sm:text-[4.6rem] lg:text-[5.6rem] xl:text-[6.4rem] 3xl:text-[7.6rem]">
          <span className="block overflow-hidden pb-[0.06em]">
            <span data-h-line className="block">
              Curated Jewellery
            </span>
          </span>
          <span className="block overflow-hidden pb-[0.06em]">
            <span data-h-line className="block italic text-ivory/85">
              For Your Consideration
            </span>
          </span>
        </h1>
        <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div data-h className="opacity-0">
            <ButtonLink href="/collections" variant="light">
              Explore Collection
            </ButtonLink>
          </div>
          {pieceCount > 0 && (
            <p data-h className="eyebrow text-[0.58rem] text-ivory/70 opacity-0">
              Prepared for {name} · <span className="numeral text-sm tracking-normal">{pieceCount}</span> Pieces
            </p>
          )}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex" aria-hidden>
        <span className="eyebrow text-[0.52rem] text-ivory/60">Scroll</span>
        <span className="relative h-12 w-px overflow-hidden bg-ivory/20">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2.4s_var(--ease-silk)_infinite] bg-soft-gold" />
        </span>
      </div>
      <style>{`@keyframes scrollcue{0%{transform:translateY(-100%)}100%{transform:translateY(200%)}}`}</style>
    </section>
  );
}
