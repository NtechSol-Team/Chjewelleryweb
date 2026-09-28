"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Parallax } from "@/components/animations/reveal";
import { RevealText } from "@/components/animations/reveal";

/** Cinematic interlude: muted macro film that plays only while in view. */
export function FilmBand({ film }: { film: { src: string; poster: string } }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !reduced && !userPaused) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [userPaused]);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      setUserPaused(false);
      v.play().catch(() => {});
    } else {
      setUserPaused(true);
      v.pause();
    }
  };

  return (
    <section className="relative h-[80svh] min-h-[480px] overflow-hidden bg-ink text-ivory">
      <Parallax speed={18} className="absolute -inset-y-[10%] inset-x-0">
        <video
          ref={video}
          className="h-full w-full object-cover transition-opacity duration-[2000ms]"
          style={{ opacity: ready ? 0.85 : 0 }}
          src={film.src}
          poster={film.poster}
          muted
          loop
          playsInline
          preload="metadata"
          onCanPlay={() => setReady(true)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          aria-hidden
        />
      </Parallax>
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-ink/50" />
      <div className="relative flex h-full flex-col items-center justify-center px-gutter text-center">
        <p className="eyebrow text-soft-gold">The Light Within</p>
        <RevealText
          text={"Selected for fire,\nbrilliance and scintillation."}
          className="display mt-6 max-w-4xl text-[2.4rem] leading-[1.08] sm:text-[3.6rem] lg:text-[4.6rem]"
        />
        <p className="mt-8 max-w-md text-[0.92rem] leading-relaxed text-ivory/70">
          Each stone is examined under north light by our gemmologists before it is ever set. Fewer than one in forty is chosen.
        </p>
      </div>
      <button
        onClick={toggle}
        className="absolute bottom-8 right-[var(--gutter)] flex items-center gap-3 eyebrow text-[0.56rem] text-ivory/70 hover:text-ivory"
        aria-label={playing ? "Pause film" : "Play film"}
      >
        <span className="grid h-10 w-10 place-items-center rounded-full border border-ivory/40">
          {playing ? <Pause className="h-3 w-3" strokeWidth={1.4} /> : <Play className="ml-0.5 h-3 w-3" strokeWidth={1.4} />}
        </span>
        {playing ? "Pause" : "Play"}
      </button>
    </section>
  );
}
