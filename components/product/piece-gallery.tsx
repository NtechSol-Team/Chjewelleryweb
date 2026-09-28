"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Film, Images, Maximize2, Rotate3d } from "lucide-react";
import type { MediaItem } from "@/lib/catalogue";
import { Watermark } from "@/components/showroom/watermark";
import { MediaImage } from "./media-image";
import { FilmPlayer } from "./film-player";
import { Lightbox } from "./lightbox";
import { cn } from "@/lib/cn";

const SpinViewer = dynamic(() => import("./spin-viewer"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 skeleton" />,
});

/** Film and 360° are surfaced early so clients discover them. */
function presentationOrder(media: MediaItem[]) {
  const images = media.filter((m) => m.kind === "image");
  const spin = media.filter((m) => m.kind === "spin");
  const video = media.filter((m) => m.kind === "video");
  return [...images.slice(0, 2), ...spin, ...images.slice(2, 3), ...video, ...images.slice(3)];
}

export function PieceGallery({ media: raw, code, name }: { media: MediaItem[]; code: string; name: string }) {
  const media = presentationOrder(raw);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const rail = useRef<HTMLDivElement>(null);
  const item = media[active];

  const images = media.filter((m) => m.kind === "image").length;
  const spinIndex = media.findIndex((m) => m.kind === "spin");
  const videoIndex = media.findIndex((m) => m.kind === "video");

  const onRailScroll = () => {
    const el = rail.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };
  const scrollRailTo = (i: number) => rail.current?.scrollTo({ left: i * rail.current.clientWidth, behavior: "smooth" });

  if (!media.length) {
    return <div className="aspect-[4/5] bg-cream" />;
  }

  return (
    <div className="protected-media">
      {/* Desktop: thumbnail rail + stage */}
      <div className="hidden gap-5 lg:grid lg:grid-cols-[72px_1fr] xl:gap-8">
        <ul className="flex flex-col gap-3" aria-label="Views of this piece">
          {media.map((m, i) => (
            <li key={m.id}>
              <button
                onClick={() => setActive(i)}
                aria-label={m.kind === "image" ? `View image ${i + 1}` : m.kind === "video" ? "Play film" : "Open 360° view"}
                aria-current={i === active}
                className={cn(
                  "relative block aspect-[4/5] w-full overflow-hidden bg-cream transition-all duration-500",
                  i === active ? "opacity-100 outline outline-1 outline-offset-[3px] outline-champagne" : "opacity-55 hover:opacity-100",
                )}
              >
                <Image src={m.kind === "video" ? m.posterUrl ?? m.url : m.url} alt="" fill sizes="72px" className="object-cover" unoptimized={m.kind === "video"} />
                {m.kind !== "image" && (
                  <span className="absolute inset-0 grid place-items-center bg-ink/35 text-ivory">
                    {m.kind === "video" ? <Film className="h-4 w-4" strokeWidth={1.1} /> : <Rotate3d className="h-4 w-4" strokeWidth={1.1} />}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="relative h-[max(560px,calc(100svh-var(--header-h)-7.5rem))] w-full overflow-hidden bg-cream">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={item.id}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <Stage item={item} name={name} onOpen={() => setLightbox(active)} priority={active === 0} />
            </motion.div>
          </AnimatePresence>
          {item.kind === "image" && (
            <button
              onClick={() => setLightbox(active)}
              className="absolute bottom-5 right-5 z-[3] flex items-center gap-2 bg-ivory/85 px-3.5 py-2 eyebrow text-[0.54rem] text-charcoal backdrop-blur-sm transition-colors hover:bg-ivory"
            >
              <Maximize2 className="h-3 w-3" strokeWidth={1.3} /> Fullscreen
            </button>
          )}
          <p className="absolute bottom-5 left-5 z-[3] numeral text-xs tracking-widest text-charcoal/70 mix-blend-difference invert">
            {String(active + 1).padStart(2, "0")} / {String(media.length).padStart(2, "0")}
          </p>
        </div>
      </div>

      {/* Mobile / tablet: swipeable, image-first */}
      <div className="relative -mx-[var(--gutter)] lg:hidden">
        <div ref={rail} onScroll={onRailScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
          {media.map((m, i) => (
            <div key={m.id} className="relative aspect-[4/5] w-full shrink-0 snap-center overflow-hidden bg-cream md:aspect-[5/4]">
              <Stage item={m} name={name} onOpen={() => setLightbox(i)} priority={i === 0} />
            </div>
          ))}
        </div>
        {media.length > 1 && (
          <>
            <button onClick={() => scrollRailTo(Math.max(0, active - 1))} aria-label="Previous view" className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center bg-ivory/70 backdrop-blur-sm disabled:opacity-0" disabled={active === 0}>
              <ChevronLeft className="h-4 w-4" strokeWidth={1.2} />
            </button>
            <button onClick={() => scrollRailTo(Math.min(media.length - 1, active + 1))} aria-label="Next view" className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center bg-ivory/70 backdrop-blur-sm disabled:opacity-0" disabled={active === media.length - 1}>
              <ChevronRight className="h-4 w-4" strokeWidth={1.2} />
            </button>
          </>
        )}
        <div className="flex items-center gap-4 px-[var(--gutter)] pt-4">
          <div className="relative h-px flex-1 bg-line">
            <motion.span className="absolute inset-y-0 left-0 bg-champagne" animate={{ width: `${((active + 1) / media.length) * 100}%` }} />
          </div>
          <span className="numeral text-xs tracking-widest text-muted">
            {String(active + 1).padStart(2, "0")} / {String(media.length).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Media summary / quick access */}
      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 lg:ml-[calc(72px+2rem)]">
        <MediaTab icon={<Images className="h-3.5 w-3.5" strokeWidth={1.2} />} label={`${images} Images`} onClick={() => (window.innerWidth >= 1024 ? setActive(0) : scrollRailTo(0))} />
        {spinIndex >= 0 && (
          <MediaTab icon={<Rotate3d className="h-3.5 w-3.5" strokeWidth={1.2} />} label="360° View" onClick={() => (window.innerWidth >= 1024 ? setActive(spinIndex) : scrollRailTo(spinIndex))} />
        )}
        {videoIndex >= 0 && (
          <MediaTab icon={<Film className="h-3.5 w-3.5" strokeWidth={1.2} />} label="Film" onClick={() => (window.innerWidth >= 1024 ? setActive(videoIndex) : scrollRailTo(videoIndex))} />
        )}
      </div>

      <AnimatePresence>
        {lightbox !== null && (
          <Lightbox media={media} index={lightbox} onIndex={setLightbox} onClose={() => setLightbox(null)} code={code} name={name} />
        )}
      </AnimatePresence>
    </div>
  );
}

function Stage({ item, name, onOpen, priority }: { item: MediaItem; name: string; onOpen: () => void; priority?: boolean }) {
  if (item.kind === "video")
    return (
      <div className="absolute inset-0">
        <FilmPlayer src={item.url} poster={item.posterUrl} className="h-full w-full" label={`${name} — film`} />
      </div>
    );
  if (item.kind === "spin" && item.frames)
    return (
      <>
        <div className="absolute inset-0">
          <SpinViewer frames={item.frames} alt={item.alt ?? name} className="h-full w-full" />
        </div>
        <Watermark density="sparse" />
      </>
    );
  return (
    <button onClick={onOpen} className="group absolute inset-0 block cursor-zoom-in" aria-label={`Open ${item.alt ?? name} fullscreen`}>
      <MediaImage
        src={item.url}
        alt={item.alt ?? name}
        fill
        priority={priority}
        sizes="(min-width:1024px) 52vw, 100vw"
        quality={85}
        className="object-cover transition-transform duration-[1800ms] ease-[var(--ease-lux)] group-hover:scale-[1.025]"
      />
      <Watermark density="sparse" />
    </button>
  );
}

function MediaTab({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 py-1 eyebrow text-[0.56rem] text-muted transition-colors hover:text-charcoal">
      {icon}
      {label}
    </button>
  );
}
