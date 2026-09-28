/** Helpers for composing campaign image URLs (focal crops for detail views). */

const BASE = "https://images.unsplash.com/";

type Crop = { x?: number; y?: number; zoom?: number; ratio?: [number, number] };

export function photo(id: string, crop?: Crop) {
  const url = new URL(BASE + id);
  if (crop) {
    const [rw, rh] = crop.ratio ?? [4, 5];
    url.searchParams.set("fit", "crop");
    url.searchParams.set("crop", "focalpoint");
    url.searchParams.set("fp-x", String(crop.x ?? 0.5));
    url.searchParams.set("fp-y", String(crop.y ?? 0.5));
    url.searchParams.set("fp-z", String(crop.zoom ?? 1));
    url.searchParams.set("ar", `${rw}:${rh}`);
  }
  return url.toString();
}

export const EDITORIAL = {
  login: photo("photo-1598218940656-7126545fd283"),
  welcome: photo("photo-1573408301185-9146fe634ad0"),
  hero: photo("photo-1674465992629-f8f81a8fb6d9"),
  craft: photo("photo-1624588057318-5f1b2eb81012"),
  craftDetail: photo("photo-1706955008775-c00874bb4d4b"),
  consultation: photo("photo-1768845431923-0146cf14804d"),
  candle: photo("photo-1788254751619-62493ce2f249"),
  portrait: photo("photo-1613966561243-c6959a886009"),
} as const;

export const FILMS = {
  sparkle: {
    src: "https://assets.mixkit.co/videos/26757/26757-720.mp4",
    poster: "https://assets.mixkit.co/videos/26757/26757-thumb-720-0.jpg",
  },
  polishing: {
    src: "https://assets.mixkit.co/videos/24656/24656-720.mp4",
    poster: "https://assets.mixkit.co/videos/24656/24656-thumb-720-0.jpg",
  },
} as const;
