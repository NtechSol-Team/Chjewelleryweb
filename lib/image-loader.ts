"use client";

type LoaderArgs = { src: string; width: number; quality?: number };

/**
 * Remote campaign imagery is served by an image CDN that resizes on the fly,
 * so we pass width/quality straight through instead of double-processing.
 * Private uploads go through the authenticated /api/media route unchanged.
 */
export default function imageLoader({ src, width, quality }: LoaderArgs) {
  if (src.startsWith("https://images.unsplash.com/")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 75));
    url.searchParams.set("auto", "format");
    if (!url.searchParams.has("fit")) url.searchParams.set("fit", "max");
    return url.toString();
  }
  const sep = src.includes("?") ? "&" : "?";
  return `${src}${sep}w=${width}`;
}
