"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MoveHorizontal } from "lucide-react";
import imageLoader from "@/lib/image-loader";
import { cn } from "@/lib/cn";

/**
 * Frame-sequence 360° viewer. Drag (or use arrow keys) to turn the piece;
 * gentle inertia on release. Loaded on demand via next/dynamic.
 */
export default function SpinViewer({
  frames,
  alt,
  className,
  tone = "light",
  width = 1100,
}: {
  frames: string[];
  alt: string;
  className?: string;
  tone?: "light" | "dark";
  width?: number;
}) {
  const [loaded, setLoaded] = useState(0);
  const [frame, setFrame] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const pos = useRef(0);
  const velocity = useRef(0);
  const drag = useRef<{ x: number; t: number } | null>(null);
  const raf = useRef<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const n = frames.length;
  const urls = frames.map((f) => imageLoader({ src: f, width, quality: 75 }));
  const ready = loaded >= n;

  // Preload the full sequence before allowing interaction.
  useEffect(() => {
    let count = 0;
    const imgs = urls.map((u) => {
      const img = new Image();
      img.onload = img.onerror = () => setLoaded(++count);
      img.src = u;
      return img;
    });
    return () => imgs.forEach((i) => (i.onload = i.onerror = null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames.join("|")]);

  const setPos = (p: number) => {
    pos.current = ((p % n) + n) % n;
    setFrame(Math.floor(pos.current));
  };

  // A slow presentation turn until the client takes control.
  useEffect(() => {
    if (!ready || interacted) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let last = performance.now();
    const loop = (t: number) => {
      setPos(pos.current + ((t - last) / 1000) * 6);
      last = t;
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, interacted]);

  const pxPerFrame = () => (root.current?.clientWidth ?? 800) / n / 0.9;

  const onDown = (e: React.PointerEvent) => {
    if (!ready) return;
    setInteracted(true);
    if (raf.current) cancelAnimationFrame(raf.current);
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, t: performance.now() };
    velocity.current = 0;
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const now = performance.now();
    const df = -dx / pxPerFrame();
    velocity.current = df / Math.max(1, now - drag.current.t);
    drag.current = { x: e.clientX, t: now };
    setPos(pos.current + df);
  };
  const onUp = () => {
    if (!drag.current) return;
    drag.current = null;
    let v = velocity.current * 16;
    const glide = () => {
      if (Math.abs(v) < 0.02) return;
      setPos(pos.current + v);
      v *= 0.93;
      raf.current = requestAnimationFrame(glide);
    };
    raf.current = requestAnimationFrame(glide);
  };

  const angle = Math.round((frame / n) * 360);
  const dark = tone === "dark";

  return (
    <div
      ref={root}
      className={cn("relative select-none overflow-hidden", dark ? "bg-ink text-ivory" : "bg-cream text-charcoal", className)}
      style={{ touchAction: "pan-y" }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      role="slider"
      tabIndex={0}
      aria-label={`${alt}. Rotate the piece`}
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={angle}
      aria-valuetext={`${angle} degrees`}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          setInteracted(true);
          setPos(pos.current + (e.key === "ArrowRight" ? 1 : -1));
        }
      }}
    >
      <div className={cn("absolute inset-0", ready ? "cursor-grab active:cursor-grabbing" : "cursor-progress")}>
        {urls.map((u, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={u}
            src={u}
            alt={i === 0 ? alt : ""}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ visibility: i === frame ? "visible" : "hidden" }}
          />
        ))}
      </div>

      <p className="pointer-events-none absolute left-5 top-5 eyebrow text-[0.58rem] mix-blend-difference text-ivory">360° View</p>

      <AnimatePresence>
        {!ready && (
          <motion.div exit={{ opacity: 0 }} className={cn("absolute inset-0 flex flex-col items-center justify-center gap-4", dark ? "bg-ink" : "bg-cream")}>
            <p className="eyebrow text-[0.58rem] opacity-70">Preparing 360° view</p>
            <div className={cn("h-px w-32", dark ? "bg-ivory/20" : "bg-line")}>
              <div className="h-full origin-left bg-champagne transition-transform duration-300" style={{ transform: `scaleX(${loaded / n})` }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-x-0 bottom-5 flex flex-col items-center gap-3 text-ivory mix-blend-difference">
        <AnimatePresence>
          {ready && !interacted && (
            <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 eyebrow text-[0.56rem]">
              <MoveHorizontal className="h-3.5 w-3.5" strokeWidth={1.2} /> Drag to explore
            </motion.p>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-3">
          <div className="relative h-px w-28 bg-ivory/40">
            <span className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-ivory" style={{ left: `calc(${(frame / n) * 100}% - 3px)` }} />
          </div>
          <span className="numeral w-9 text-xs">{String(angle).padStart(3, "0")}°</span>
        </div>
      </div>
    </div>
  );
}
