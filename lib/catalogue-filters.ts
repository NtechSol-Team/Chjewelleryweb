import type { ActiveFilters, Facets, FilterOption } from "@/components/catalogue/catalogue-browser";
import type { PieceCard } from "@/lib/catalogue";
import { CATEGORIES, GENDERS, SHAPES } from "@/lib/taxonomy";

type SP = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []).filter(Boolean).slice(0, 20);

export function parseFilters(sp: SP): ActiveFilters {
  const sort = sp.sort === "new" || sp.sort === "code" ? sp.sort : "curated";
  return {
    category: list(sp.category),
    gender: list(sp.gender),
    shape: list(sp.shape),
    collection: list(sp.collection),
    q: typeof sp.q === "string" ? sp.q.slice(0, 60) : "",
    sort,
  };
}

/** Facet counts are computed from the client's full catalogue, not the filtered view. */
export function buildFacets(all: PieceCard[], opts: { withCollections?: boolean } = {}): Facets {
  const count = (fn: (p: PieceCard) => string | null | undefined) => {
    const m = new Map<string, number>();
    for (const p of all) {
      const k = fn(p);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  };
  const from = (defs: readonly { code: string; label: string }[], m: Map<string, number>): FilterOption[] =>
    defs.filter((d) => m.has(d.code)).map((d) => ({ value: d.code, label: d.label, count: m.get(d.code)! }));

  const facets: Facets = {
    category: from(CATEGORIES, count((p) => p.category)),
    gender: from(GENDERS, count((p) => p.gender)),
    shape: from(SHAPES, count((p) => p.shape)),
  };
  if (opts.withCollections) {
    const m = new Map<string, { label: string; count: number }>();
    for (const p of all) if (p.collection) m.set(p.collection.slug, { label: p.collection.name, count: (m.get(p.collection.slug)?.count ?? 0) + 1 });
    facets.collection = [...m.entries()].map(([value, v]) => ({ value, label: v.label, count: v.count }));
  }
  return facets;
}
