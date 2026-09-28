"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X, ZoomIn, ZoomOut, Rotate3d, Film } from "lucide-react";
import type { MediaItem } from "@/lib/catalogue";
import { Watermark } from "@/components/showroom/watermark";
import { FilmPlayer } from "./film-player";
import { cn } from "@/lib/cn";

const SpinViewer = dynamic(() => import("./spin-viewer"), { ssr: false });

/**
 * Immersive viewer: near-black, edge-to-edge media, keyboard and swipe
 * navigation, zoom with pan, native fullscreen.
 */
export function Lightbox({
  media,
  index,
  onIndex,
  onClose,
  code,
  name,
}: {
  media: MediaItem[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  code: string;
  name: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [origin, setOrigin] = useState("50% 50%");
  const [dir, setDir] = useState(1);
  const [isFs, setIsFs] = useState(false);
  const item = media[index];

  const go = useCallback(
    (delta: number) => {
      setDir(delta);
      setZoom(1);
      onIndex((index + delta + media.length) % media.length);
    },
    [index, media.length, onIndex],
  );

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    root.current?.focus();
    document.body.style.overflow = "hidden";
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("fullscreenchange", onFs);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      prevFocus?.focus?.();
    };
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowRight" && item.kind !== "spin") go(1);
    else if (e.key === "ArrowLeft" && item.kind !== "spin") go(-1);
    else if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(3, z + 1));
    else if (e.key === "-") setZoom((z) => Math.max(1, z - 1));
    else if (e.key.toLowerCase() === "f") toggleFs();
    else if (e.key === "Tab") {
      // Keep focus inside the dialog.
      const focusables = root.current?.querySelectorAll<HTMLElement>("button, [tabindex='0']");
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else root.current?.requestFullscreen?.().catch(() => {});
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (zoom === 1 || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return createPortal(
    <motion.div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={`${code} ${name} — media viewer`}
      tabIndex={-1}
      onKeyDown={onKey}
      className="protected-media fixed inset-0 z-[90] flex flex-col bg-[#0a0a09] text-ivory outline-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative z-10 flex h-16 items-center justify-between px-4 sm:px-8">
        <p className="min-w-0 truncate eyebrow text-[0.58rem] text-ivory/70">
          <span className="text-soft-gold">{code}</span>
          <span className="hidden sm:inline"> · {name}</span>
        </p>
        <p className="numeral absolute left-1/2 -translate-x-1/2 text-sm tracking-widest text-ivory/70" aria-live="polite">
          {String(index + 1).padStart(2, "0")} <span className="text-ivory/30">/ {String(media.length).padStart(2, "0")}</span>
        </p>
        <div className="flex items-center gap-1">
          {item.kind === "image" && (
            <>
              <IconButton label="Zoom out" onClick={() => setZoom((z) => Math.max(1, z - 1))} disabled={zoom === 1}>
                <ZoomOut className="h-4 w-4" strokeWidth={1.2} />
              </IconButton>
              <IconButton label="Zoom in" onClick={() => setZoom((z) => Math.min(3, z + 1))} disabled={zoom === 3}>
                <ZoomIn className="h-4 w-4" strokeWidth={1.2} />
              </IconButton>
            </>
          )}
          <IconButton label={isFs ? "Exit fullscreen" : "Fullscreen"} onClick={toggleFs} className="hidden sm:grid">
            {isFs ? <Minimize2 className="h-4 w-4" strokeWidth={1.2} /> : <Maximize2 className="h-4 w-4" strokeWidth={1.2} />}
          </IconButton>
          <IconButton label="Close viewer" onClick={onClose}>
            <X className="h-5 w-5" strokeWidth={1.2} />
          </IconButton>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={item.id}
            custom={dir}
            className="absolute inset-0"
            initial={{ opacity: 0, x: dir * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -60 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            drag={item.kind === "image" && zoom === 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) go(1);
              else if (info.offset.x > 80) go(-1);
            }}
          >
            {item.kind === "image" && (
              <div
                className={cn("relative h-full w-full", zoom > 1 ? "cursor-zoom-out" : "cursor-zoom-in")}
                onPointerMove={onPointerMove}
                onDoubleClick={() => setZoom((z) => (z > 1 ? 1 : 2))}
                onClick={(e) => e.detail === 1 && zoom > 1 && setZoom(1)}
              >
                <div className="absolute inset-0 transition-transform duration-700 ease-[var(--ease-lux)]" style={{ transform: `scale(${zoom})`, transformOrigin: origin }}>
                  <Image src={item.url} alt={item.alt ?? name} fill sizes="100vw" quality={85} className="object-contain" draggable={false} onContextMenu={(e) => e.preventDefault()} />
                </div>
                <Watermark />
              </div>
            )}
            {item.kind === "video" && (
              <div className="flex h-full items-center justify-center px-4 pb-4 sm:px-16">
                <FilmPlayer src={item.url} poster={item.posterUrl} className="aspect-video w-full max-w-6xl" />
              </div>
            )}
            {item.kind === "spin" && item.frames && (
              <div className="flex h-full items-center justify-center px-4 pb-4">
                <div className="relative aspect-square h-full max-h-full max-w-full">
                  <SpinViewer frames={item.frames} alt={item.alt ?? name} tone="dark" width={1400} className="h-full w-full" />
                  <Watermark density="sparse" />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {media.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous" className="absolute left-2 top-1/2 z-10 grid h-14 w-14 -translate-y-1/2 place-items-center text-ivory/70 transition-colors hover:text-ivory sm:left-6">
              <ChevronLeft className="h-6 w-6" strokeWidth={0.9} />
            </button>
            <button onClick={() => go(1)} aria-label="Next" className="absolute right-2 top-1/2 z-10 grid h-14 w-14 -translate-y-1/2 place-items-center text-ivory/70 transition-colors hover:text-ivory sm:right-6">
              <ChevronRight className="h-6 w-6" strokeWidth={0.9} />
            </button>
          </>
        )}
      </div>

      <div className="no-scrollbar flex justify-center gap-2 overflow-x-auto px-4 py-4">
        {media.map((m, i) => (
          <button
            key={m.id}
            onClick={() => {
              setDir(i > index ? 1 : -1);
              setZoom(1);
              onIndex(i);
            }}
            aria-label={`Show media ${i + 1}`}
            aria-current={i === index}
            className={cn("relative h-14 w-11 shrink-0 overflow-hidden transition-opacity duration-500", i === index ? "opacity-100 outline outline-1 outline-offset-2 outline-soft-gold" : "opacity-40 hover:opacity-80")}
          >
            <Image src={m.kind === "video" ? m.posterUrl ?? m.url : m.url} alt="" fill sizes="44px" className="object-cover" unoptimized={m.kind === "video"} />
            {m.kind !== "image" && (
              <span className="absolute inset-0 grid place-items-center bg-ink/40">
                {m.kind === "video" ? <Film className="h-3.5 w-3.5" strokeWidth={1.2} /> : <Rotate3d className="h-3.5 w-3.5" strokeWidth={1.2} />}
              </span>
            )}
          </button>
        ))}
      </div>
    </motion.div>,
    document.body,
  );
}

function IconButton({ label, children, className, ...props }: React.ComponentProps<"button"> & { label: string }) {
  return (
    <button aria-label={label} title={label} className={cn("grid h-11 w-11 place-items-center text-ivory/80 transition-colors hover:text-ivory disabled:opacity-30", className)} {...props}>
      {children}
    </button>
  );
}
