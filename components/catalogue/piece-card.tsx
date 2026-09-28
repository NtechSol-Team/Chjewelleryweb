"use client";

import Link from "next/link";
import { ArrowRight, Film, Rotate3d } from "lucide-react";
import type { PieceCard as Piece } from "@/lib/catalogue";
import { categoryLabel } from "@/lib/taxonomy";
import { cn } from "@/lib/cn";
import { MediaImage } from "@/components/product/media-image";
import { ShortlistHeart } from "./shortlist-button";

export function PieceCard({
  piece,
  ratio = "portrait",
  sizes = "(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw",
  priority,
  className,
}: {
  piece: Piece;
  ratio?: "portrait" | "tall" | "square" | "landscape";
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const aspect = { portrait: "aspect-[4/5]", tall: "aspect-[3/4]", square: "aspect-square", landscape: "aspect-[5/4]" }[ratio];
  return (
    <article className={cn("group relative", className)}>
      <Link href={`/product/${piece.code}`} className="block" aria-label={`View piece ${piece.code}, ${piece.name}`}>
        <div className={cn("protected-media relative overflow-hidden bg-cream", aspect)}>
          {piece.image && (
            <MediaImage
              src={piece.image}
              alt={piece.imageAlt}
              fill
              sizes={sizes}
              priority={priority}
              className="object-cover transition-transform duration-[1600ms] ease-[var(--ease-lux)] group-hover:scale-[1.035]"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
          {piece.isNew && (
            <span className="absolute left-4 top-4 bg-ivory/90 px-2.5 py-1 eyebrow text-[0.52rem] text-charcoal backdrop-blur-sm">New</span>
          )}
          {(piece.hasVideo || piece.hasSpin) && (
            <span className="absolute bottom-4 left-4 flex items-center gap-3 text-ivory opacity-0 transition-opacity duration-700 group-hover:opacity-100">
              {piece.hasSpin && (
                <span className="flex items-center gap-1.5 eyebrow text-[0.52rem]">
                  <Rotate3d className="h-3.5 w-3.5" strokeWidth={1.2} /> 360°
                </span>
              )}
              {piece.hasVideo && (
                <span className="flex items-center gap-1.5 eyebrow text-[0.52rem]">
                  <Film className="h-3.5 w-3.5" strokeWidth={1.2} /> Film
                </span>
              )}
            </span>
          )}
        </div>
        <div className="pt-5">
          <div className="flex items-baseline justify-between gap-4">
            <p className="eyebrow text-[0.6rem] text-gold-deep">{piece.code}</p>
            <p className="eyebrow text-[0.56rem] text-muted">{categoryLabel(piece.category)}</p>
          </div>
          <h3 className="mt-2 font-display text-[1.45rem] leading-tight text-charcoal md:text-[1.6rem]">{piece.name}</h3>
          <div className="mt-3 flex items-center gap-3">
            <span className="h-px w-6 bg-line transition-all duration-700 ease-[var(--ease-lux)] group-hover:w-12 group-hover:bg-champagne" />
            <span className="flex items-center gap-2 eyebrow text-[0.56rem] text-charcoal opacity-0 transition-all duration-700 group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-60">
              View Piece
              <ArrowRight className="h-3 w-3 -translate-x-1 transition-transform duration-700 group-hover:translate-x-0.5" strokeWidth={1.25} />
            </span>
          </div>
        </div>
      </Link>
      <ShortlistHeart id={piece.id} code={piece.code} tone="light" className="absolute right-2 top-2 z-[3] drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]" />
    </article>
  );
}

export function PieceCardSkeleton({ ratio = "portrait" }: { ratio?: "portrait" | "tall" }) {
  return (
    <div aria-hidden>
      <div className={cn("skeleton", ratio === "tall" ? "aspect-[3/4]" : "aspect-[4/5]")} />
      <div className="mt-5 h-2.5 w-16 skeleton" />
      <div className="mt-3 h-5 w-3/4 skeleton" />
    </div>
  );
}
