"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { motion } from "framer-motion";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";

type RevealTextProps = {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  /** "mount" plays immediately; "scroll" waits for the viewport. */
  on?: "mount" | "scroll";
  stagger?: number;
};

/** Editorial headline reveal: each word rises from behind a mask. */
export function RevealText({ text, as: Tag = "h2", className, delay = 0, on = "scroll", stagger = 0.07 }: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const words = ref.current?.querySelectorAll("[data-word]");
      if (!words?.length) return;
      if (prefersReducedMotion()) {
        gsap.set(words, { yPercent: 0, opacity: 1 });
        return;
      }
      gsap.fromTo(
        words,
        { yPercent: 115, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 1.4,
          ease: "expo.out",
          stagger,
          delay,
          scrollTrigger: on === "scroll" ? { trigger: ref.current, start: "top 88%", once: true } : undefined,
        },
      );
    },
    { scope: ref },
  );

  const lines = text.split("\n");
  return (
    <Tag ref={ref} className={className} aria-label={text.replace(/\n/g, " ")}>
      {lines.map((line, li) => (
        <span key={li} className="block" aria-hidden>
          {line.split(" ").map((word, wi) => (
            <span key={wi} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
              <span data-word className="inline-block opacity-0 will-change-transform">
                {word}
                {wi < line.split(" ").length - 1 ? " " : ""}
              </span>
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}

/** Image enters through a rising mask while the photograph settles from 1.18× scale. */
export function RevealMask({
  children,
  className,
  delay = 0,
  on = "scroll",
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  on?: "mount" | "scroll";
  direction?: "up" | "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const inner = el.querySelector("[data-reveal-inner]");
      if (prefersReducedMotion()) return;
      const from =
        direction === "left" ? "inset(0 100% 0 0)" : direction === "right" ? "inset(0 0 0 100%)" : "inset(100% 0 0 0)";
      const tl = gsap.timeline({
        delay,
        scrollTrigger: on === "scroll" ? { trigger: el, start: "top 90%", once: true } : undefined,
      });
      tl.fromTo(el, { clipPath: from }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut" });
      if (inner) tl.fromTo(inner, { scale: 1.18 }, { scale: 1, duration: 2.2, ease: "expo.out" }, 0.2);
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={className} style={{ clipPath: "inset(0 0 0 0)" }}>
      <div data-reveal-inner className="h-full w-full will-change-transform">
        {children}
      </div>
    </div>
  );
}

/** Scroll-linked drift. Positive speed moves slower than the page. */
export function Parallax({ children, className, speed = 12 }: { children: ReactNode; className?: string; speed?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;
      gsap.fromTo(
        ref.current,
        { yPercent: -speed / 2 },
        {
          yPercent: speed / 2,
          ease: "none",
          scrollTrigger: { trigger: ref.current.parentElement, start: "top bottom", end: "bottom top", scrub: 0.6 },
        },
      );
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Small component entrance — used for metadata, captions and cards. */
export function FadeUp({
  children,
  className,
  delay = 0,
  y = 18,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "li" | "section" | "p";
}) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Comp>
  );
}
