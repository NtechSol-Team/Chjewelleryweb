"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { Wordmark } from "@/components/ui/brand";

export function WelcomeExperience({
  name,
  image,
  collections,
  pieces,
  advisor,
}: {
  name: string;
  image: string;
  collections: number;
  pieces: number;
  advisor: string | null;
}) {
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  useGSAP(
    () => {
      let introPending = false;
      try {
        introPending = sessionStorage.getItem("chj_intro_seen") !== "1";
      } catch {}
      const reduced = prefersReducedMotion();
      if (reduced) {
        gsap.set("[data-w]", { opacity: 1, y: 0 });
        return;
      }
      const tl = gsap.timeline({ delay: introPending ? 2.1 : 0.2 });
      tl.fromTo("[data-w-photo]", { scale: 1.25, opacity: 0 }, { scale: 1.08, opacity: 1, duration: 3.4, ease: "expo.out" })
        .fromTo("[data-w]", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.6, stagger: 0.14, ease: "expo.out" }, 0.6)
        .fromTo("[data-w-rule]", { scaleX: 0 }, { scaleX: 1, duration: 1.6, ease: "expo.inOut" }, 1);
      // Slow drift, and a light reflection that crosses the frame periodically.
      gsap.to("[data-w-photo]", { scale: 1.16, duration: 24, ease: "none", repeat: -1, yoyo: true, delay: 3.4 });
      gsap.fromTo(
        "[data-w-glint]",
        { xPercent: -120 },
        { xPercent: 220, duration: 3.6, ease: "power2.inOut", repeat: -1, repeatDelay: 5, delay: 2.4 },
      );
    },
    { scope: root },
  );

  // Soft pointer parallax on the photograph (desktop only).
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || prefersReducedMotion()) return;
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    gsap.to("[data-w-layer]", { x: x * -24, y: y * -16, duration: 1.8, ease: "expo.out" });
  };

  const enter = () => {
    if (leaving) return;
    setLeaving(true);
    if (prefersReducedMotion()) return router.push("/catalogue");
    gsap
      .timeline({ onComplete: () => router.push("/catalogue") })
      .to("[data-w]", { opacity: 0, y: -20, duration: 0.6, stagger: 0.05, ease: "power2.in" })
      .fromTo("[data-w-curtain]", { yPercent: 100 }, { yPercent: 0, duration: 0.9, ease: "expo.inOut" }, 0.2);
  };

  return (
    <main ref={root} onPointerMove={onMove} className="relative h-dvh overflow-hidden bg-ink text-ivory">
      <div data-w-layer className="absolute -inset-8">
        <div data-w-photo className="absolute inset-0 opacity-0 will-change-transform">
          <Image src={image} alt="" fill priority sizes="100vw" className="object-cover object-center" />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          data-w-glint
          className="absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent mix-blend-screen"
        />
      </div>
      <div className="absolute inset-0 bg-ink/55" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(12,12,11,0.35)_0%,rgba(12,12,11,0.85)_80%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-ink/40" />

      <header className="relative z-10 flex items-center justify-between px-gutter pt-8">
        <Wordmark tone="light" className="text-[0.85rem]" />
        <p data-w className="hidden items-center gap-2 eyebrow text-[0.58rem] text-ivory/70 opacity-0 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-soft-gold" /> Private Viewing · Session Active
        </p>
      </header>

      <section className="relative z-10 flex h-[calc(100dvh-5rem)] flex-col items-center justify-center px-6 text-center">
        <p data-w className="eyebrow text-soft-gold opacity-0">
          Welcome
        </p>
        <h1 data-w className="display mt-6 text-[3rem] leading-[1] opacity-0 sm:text-[4.5rem] lg:text-[6.2rem]">
          {name}
        </h1>
        <span data-w-rule className="mt-9 block h-px w-24 origin-center bg-champagne" />
        <p data-w className="mt-8 max-w-md font-display text-[1.45rem] italic leading-snug text-ivory/85 opacity-0 sm:text-[1.7rem]">
          Your curated collection has been prepared for you.
        </p>
        <p data-w className="mt-6 eyebrow text-[0.6rem] text-ivory/60 opacity-0">
          {collections} {collections === 1 ? "Collection" : "Collections"} · {pieces} {pieces === 1 ? "Piece" : "Pieces"}
          {advisor ? ` · Presented by ${advisor}` : ""}
        </p>
        <div data-w className="mt-14 opacity-0">
          <button
            onClick={enter}
            className="group relative inline-flex h-14 items-center gap-4 border border-ivory/40 px-10 eyebrow text-[0.66rem] text-ivory transition-colors duration-700 hover:border-ivory hover:bg-ivory hover:text-charcoal"
          >
            Explore Collection
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-700 group-hover:translate-x-1.5" strokeWidth={1.25} />
          </button>
        </div>
      </section>

      <div data-w-curtain className="absolute inset-0 z-20 flex translate-y-full items-center justify-center bg-ivory">
        <Wordmark className="text-base" />
      </div>
    </main>
  );
}
