"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Pause, Play, Volume2, VolumeX, ImageOff } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Cinematic product film: muted autoplay while visible (unless reduced
 * motion), slow fade-in, and a deliberately minimal control set.
 */
export function FilmPlayer({
  src,
  poster,
  className,
  autoPlay = true,
  label = "Product film",
}: {
  src: string;
  poster?: string | null;
  className?: string;
  autoPlay?: boolean;
  label?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const v = video.current;
    if (!v || !autoPlay) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.5 });
    io.observe(v);
    return () => io.disconnect();
  }, [autoPlay]);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  if (failed) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3 bg-ink text-ivory/70", className)}>
        <ImageOff className="h-5 w-5" strokeWidth={1} />
        <p className="eyebrow text-[0.56rem]">Media unavailable</p>
        <p className="text-[0.8rem] text-ivory/50">This film is temporarily unavailable.</p>
      </div>
    );
  }

  return (
    <div ref={wrap} className={cn("group relative overflow-hidden bg-ink", className)}>
      <video
        ref={video}
        src={src}
        poster={poster ?? undefined}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        aria-label={label}
        onCanPlay={() => setReady(true)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
        onClick={toggle}
        onContextMenu={(e) => e.preventDefault()}
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        className={cn("h-full w-full cursor-pointer object-cover transition-opacity duration-[1600ms]", ready ? "opacity-100" : "opacity-0")}
      />

      {!playing && (
        <button
          onClick={toggle}
          className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-ivory/60 text-ivory backdrop-blur-[2px] transition-all duration-700 hover:scale-105 hover:border-ivory"
          aria-label="Play film"
        >
          <Play className="ml-1 h-5 w-5" strokeWidth={1} />
        </button>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center gap-4 bg-gradient-to-t from-ink/70 to-transparent px-5 pb-4 pt-10 text-ivory opacity-100 transition-opacity duration-500 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
        <button onClick={toggle} aria-label={playing ? "Pause film" : "Play film"} className="grid h-8 w-8 place-items-center">
          {playing ? <Pause className="h-3.5 w-3.5" strokeWidth={1.3} /> : <Play className="h-3.5 w-3.5" strokeWidth={1.3} />}
        </button>
        <button
          className="relative h-6 flex-1"
          aria-label="Seek"
          onClick={(e) => {
            const v = video.current;
            if (!v?.duration) return;
            const r = e.currentTarget.getBoundingClientRect();
            v.currentTime = ((e.clientX - r.left) / r.width) * v.duration;
          }}
        >
          <span className="absolute inset-x-0 top-1/2 h-px bg-ivory/25" />
          <span className="absolute left-0 top-1/2 h-px origin-left bg-soft-gold" style={{ width: `${progress * 100}%` }} />
        </button>
        <button onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute" : "Mute"} className="grid h-8 w-8 place-items-center">
          {muted ? <VolumeX className="h-3.5 w-3.5" strokeWidth={1.3} /> : <Volume2 className="h-3.5 w-3.5" strokeWidth={1.3} />}
        </button>
        <button
          onClick={() => (document.fullscreenElement ? document.exitFullscreen() : wrap.current?.requestFullscreen?.())}
          aria-label="Fullscreen"
          className="grid h-8 w-8 place-items-center"
        >
          <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.3} />
        </button>
      </div>
    </div>
  );
}
