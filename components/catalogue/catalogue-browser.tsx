"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, LayoutGrid, Search, SlidersHorizontal, Square, X } from "lucide-react";
import type { PieceCard as Piece } from "@/lib/catalogue";
import { cn } from "@/lib/cn";
import { PieceCard } from "./piece-card";
import { EmptyState } from "@/components/ui/editorial";

export type FilterOption = { value: string; label: string; count: number };
export type Facets = {
  category: FilterOption[];
  gender: FilterOption[];
  shape: FilterOption[];
  collection?: FilterOption[];
};
export type ActiveFilters = {
  category: string[];
  gender: string[];
  shape: string[];
  collection: string[];
  q: string;
  sort: "curated" | "new" | "code";
};

const GROUPS = [
  { key: "category", label: "Category" },
  { key: "gender", label: "Gender" },
  { key: "shape", label: "Shape" },
  { key: "collection", label: "Collection" },
] as const;

const SORTS = [
  { value: "curated", label: "Curated order" },
  { value: "new", label: "Newest first" },
  { value: "code", label: "Reference" },
] as const;

type GroupKey = (typeof GROUPS)[number]["key"];

// Grid density is a per-viewer preference kept in localStorage.
const subscribeGrid = (cb: () => void) => {
  window.addEventListener("chj-grid", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("chj-grid", cb);
    window.removeEventListener("storage", cb);
  };
};
const readGrid = () => {
  try {
    return localStorage.getItem("chj_grid") === "dense";
  } catch {
    return false;
  }
};

function toQuery(f: ActiveFilters) {
  const sp = new URLSearchParams();
  for (const g of GROUPS) f[g.key].forEach((v) => sp.append(g.key, v));
  if (f.q) sp.set("q", f.q);
  if (f.sort !== "curated") sp.set("sort", f.sort);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function CatalogueBrowser({ pieces, facets, active }: { pieces: Piece[]; facets: Facets; active: ActiveFilters }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState<GroupKey | "sort" | null>(null);
  const [drawer, setDrawer] = useState<"filter" | "sort" | null>(null);
  const [q, setQ] = useState(active.q);
  const dense = useSyncExternalStore(subscribeGrid, readGrid, () => false);

  const apply = (next: ActiveFilters) => {
    start(() => router.replace(`${pathname}${toQuery(next)}`, { scroll: false }));
  };
  const toggleValue = (key: GroupKey, value: string) => {
    const set = new Set(active[key]);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    apply({ ...active, [key]: [...set] });
  };
  const clearAll = () => {
    setQ("");
    apply({ category: [], gender: [], shape: [], collection: [], q: "", sort: active.sort });
  };

  const groups = GROUPS.filter((g) => (facets[g.key]?.length ?? 0) > 1);
  const chips = groups.flatMap((g) =>
    active[g.key].map((v) => ({ key: g.key, value: v, label: facets[g.key]?.find((o) => o.value === v)?.label ?? v })),
  );
  const activeCount = chips.length + (active.q ? 1 : 0);

  const setDensity = (d: boolean) => {
    try {
      localStorage.setItem("chj_grid", d ? "dense" : "editorial");
    } catch {}
    window.dispatchEvent(new Event("chj-grid"));
  };

  return (
    <div>
      {/* Desktop / tablet filter bar */}
      <div className="sticky top-[var(--header-h)] z-30 hidden border-y border-line bg-ivory/95 backdrop-blur-md md:block">
        <div className="flex h-16 items-center justify-between gap-6 px-gutter">
          <div className="flex items-center gap-1">
            {groups.map((g) => (
              <button
                key={g.key}
                onClick={() => setOpen(open === g.key ? null : g.key)}
                aria-expanded={open === g.key}
                className={cn(
                  "flex h-10 items-center gap-2 px-4 eyebrow text-[0.6rem] transition-colors",
                  open === g.key || active[g.key].length ? "text-charcoal" : "text-muted hover:text-charcoal",
                )}
              >
                {g.label}
                {active[g.key].length > 0 && <span className="numeral text-[0.8rem] tracking-normal text-gold-deep">{active[g.key].length}</span>}
                <ChevronDown className={cn("h-3 w-3 transition-transform duration-500", open === g.key && "rotate-180")} strokeWidth={1.25} />
              </button>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                apply({ ...active, q: q.trim() });
              }}
              className="ml-3 flex items-center gap-2 border-l border-line pl-6"
            >
              <Search className="h-3.5 w-3.5 text-muted" strokeWidth={1.25} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onBlur={() => q.trim() !== active.q && apply({ ...active, q: q.trim() })}
                placeholder="Reference or name"
                aria-label="Search by reference or name"
                className="w-36 bg-transparent py-2 text-[0.8rem] outline-none placeholder:text-muted/60 lg:w-48"
              />
            </form>
          </div>
          <div className="flex items-center gap-6">
            <p className="numeral text-[0.95rem] text-muted" aria-live="polite">
              {pieces.length} {pieces.length === 1 ? "piece" : "pieces"}
            </p>
            <div className="relative">
              <button
                onClick={() => setOpen(open === "sort" ? null : "sort")}
                aria-expanded={open === "sort"}
                className="flex h-10 items-center gap-2 eyebrow text-[0.6rem] text-muted hover:text-charcoal"
              >
                {SORTS.find((s) => s.value === active.sort)?.label}
                <ChevronDown className={cn("h-3 w-3 transition-transform", open === "sort" && "rotate-180")} strokeWidth={1.25} />
              </button>
              <AnimatePresence>
                {open === "sort" && (
                  <motion.ul
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 top-12 w-52 border border-line bg-ivory py-2 shadow-[0_24px_48px_-32px_rgba(12,12,11,0.4)]"
                  >
                    {SORTS.map((s) => (
                      <li key={s.value}>
                        <button
                          onClick={() => {
                            setOpen(null);
                            apply({ ...active, sort: s.value });
                          }}
                          className="flex w-full items-center justify-between px-5 py-2.5 text-left text-[0.85rem] hover:bg-cream"
                        >
                          {s.label}
                          {active.sort === s.value && <Check className="h-3.5 w-3.5 text-gold-deep" strokeWidth={1.4} />}
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
            <div className="hidden items-center gap-1 border-l border-line pl-5 lg:flex" role="group" aria-label="Grid density">
              <button onClick={() => setDensity(false)} aria-pressed={!dense} className={cn("grid h-8 w-8 place-items-center", dense ? "text-muted" : "text-charcoal")} aria-label="Editorial grid">
                <Square className="h-3.5 w-3.5" strokeWidth={1.2} />
              </button>
              <button onClick={() => setDensity(true)} aria-pressed={dense} className={cn("grid h-8 w-8 place-items-center", dense ? "text-charcoal" : "text-muted")} aria-label="Overview grid">
                <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.2} />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {open && open !== "sort" && (
            <motion.div
              key={open}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-line"
            >
              <div className="flex items-start justify-between gap-10 px-gutter py-8">
                <ul className="grid flex-1 grid-cols-2 gap-x-10 gap-y-1 lg:grid-cols-4">
                  {facets[open]?.map((o) => {
                    const on = active[open].includes(o.value);
                    return (
                      <li key={o.value}>
                        <button onClick={() => toggleValue(open, o.value)} aria-pressed={on} className="group flex w-full items-center gap-4 py-2.5 text-left">
                          <span className={cn("grid h-3.5 w-3.5 place-items-center border transition-colors", on ? "border-charcoal bg-charcoal" : "border-line group-hover:border-charcoal")}>
                            {on && <Check className="h-2.5 w-2.5 text-ivory" strokeWidth={2} />}
                          </span>
                          <span className={cn("font-display text-[1.3rem] leading-none", on ? "text-charcoal" : "text-charcoal/70 group-hover:text-charcoal")}>{o.label}</span>
                          <span className="numeral text-xs text-muted">{o.count}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <button onClick={() => setOpen(null)} className="eyebrow text-[0.58rem] text-muted hover:text-charcoal">
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active chips */}
      <AnimatePresence>
        {activeCount > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 px-gutter pt-6">
              {active.q && (
                <Chip
                  label={`“${active.q}”`}
                  onRemove={() => {
                    setQ("");
                    apply({ ...active, q: "" });
                  }}
                />
              )}
              {chips.map((c) => (
                <Chip key={c.key + c.value} label={c.label} onRemove={() => toggleValue(c.key, c.value)} />
              ))}
              <button onClick={clearAll} className="ml-2 eyebrow text-[0.56rem] text-muted underline decoration-line underline-offset-4 hover:text-charcoal">
                Clear all
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div className={cn("relative px-gutter pb-32 pt-10 transition-opacity duration-500 md:pt-14", pending && "opacity-40")} aria-busy={pending}>
        {pending && <span className="absolute inset-x-0 top-0 h-px origin-left bg-champagne" style={{ animation: "loader-line 1.2s var(--ease-silk) infinite" }} />}
        {pieces.length === 0 ? (
          <EmptyState
            title="No pieces found"
            body="Try adjusting your selection."
            action={
              <button onClick={clearAll} className="lux-link eyebrow text-[0.64rem]">
                <span>Clear selection</span>
                <span className="lux-line" />
              </button>
            }
          />
        ) : (
          <ul
            className={cn(
              "grid gap-x-5 gap-y-14 xs:grid-cols-2 md:gap-x-8 md:gap-y-20",
              dense ? "lg:grid-cols-4 lg:gap-x-6 lg:gap-y-16" : "lg:grid-cols-3 lg:gap-x-12 lg:gap-y-28 xl:gap-x-16",
            )}
          >
            {pieces.map((p, i) => (
              <motion.li
                key={p.id}
                layout="position"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -6% 0px" }}
                transition={{ duration: 1, delay: (i % 3) * 0.08 }}
              >
                {/* Editorial rhythm: the centre column sits lower on desktop. */}
                <div className={cn(!dense && i % 3 === 1 && "lg:translate-y-24")}>
                <PieceCard
                  piece={p}
                  priority={i < 3}
                  ratio={!dense && i % 3 === 1 ? "tall" : "portrait"}
                  sizes={dense ? "(min-width:1024px) 23vw, (min-width:420px) 48vw, 100vw" : "(min-width:1024px) 30vw, (min-width:420px) 48vw, 100vw"}
                />
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      {/* Mobile fixed action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-line bg-ivory/95 backdrop-blur-md md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <button onClick={() => setDrawer("filter")} className="flex h-14 items-center justify-center gap-2 eyebrow text-[0.62rem]">
          <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.25} /> Filter {activeCount > 0 && <span className="numeral text-gold-deep">({activeCount})</span>}
        </button>
        <button onClick={() => setDrawer("sort")} className="flex h-14 items-center justify-center gap-2 border-l border-line eyebrow text-[0.62rem]">
          Sort
        </button>
      </div>

      <div className="h-14 md:hidden" aria-hidden />
      <MobileDrawer
        open={drawer}
        onClose={() => setDrawer(null)}
        groups={groups}
        facets={facets}
        active={active}
        onApply={(next) => {
          setDrawer(null);
          apply(next);
        }}
      />
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.span layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 border border-line bg-pearl py-1.5 pl-3.5 pr-2 text-[0.78rem]">
      {label}
      <button onClick={onRemove} aria-label={`Remove ${label}`} className="grid h-5 w-5 place-items-center text-muted hover:text-charcoal">
        <X className="h-3 w-3" strokeWidth={1.4} />
      </button>
    </motion.span>
  );
}

function MobileDrawer({
  open,
  onClose,
  groups,
  facets,
  active,
  onApply,
}: {
  open: "filter" | "sort" | null;
  onClose: () => void;
  groups: readonly { key: GroupKey; label: string }[];
  facets: Facets;
  active: ActiveFilters;
  onApply: (f: ActiveFilters) => void;
}) {
  const [draft, setDraft] = useState(active);
  const [section, setSection] = useState<GroupKey | null>("category");
  // Reset the draft each time the drawer opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(active);
  }

  const toggle = (key: GroupKey, v: string) =>
    setDraft((d) => ({ ...d, [key]: d[key].includes(v) ? d[key].filter((x) => x !== v) : [...d[key], v] }));

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[60] bg-ink/40 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={open === "filter" ? "Filter pieces" : "Sort pieces"}
            className="fixed inset-x-0 bottom-0 z-[61] flex max-h-[86dvh] flex-col bg-ivory md:hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => info.offset.y > 120 && onClose()}
          >
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-line" />
            <div className="flex items-center justify-between px-6 pb-2 pt-5">
              <p className="eyebrow text-[0.64rem]">{open === "filter" ? "Filter" : "Sort"}</p>
              <button onClick={onClose} aria-label="Close" className="grid h-10 w-10 place-items-center">
                <X className="h-4 w-4" strokeWidth={1.25} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {open === "sort" ? (
                <ul>
                  {SORTS.map((s) => (
                    <li key={s.value}>
                      <button onClick={() => onApply({ ...active, sort: s.value })} className="flex w-full items-center justify-between border-b border-line py-5 text-left font-display text-2xl">
                        {s.label}
                        {active.sort === s.value && <Check className="h-4 w-4 text-gold-deep" strokeWidth={1.4} />}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                groups.map((g) => (
                  <div key={g.key} className="border-b border-line">
                    <button onClick={() => setSection(section === g.key ? null : g.key)} aria-expanded={section === g.key} className="flex w-full items-center justify-between py-5">
                      <span className="eyebrow text-[0.62rem]">
                        {g.label}
                        {draft[g.key].length > 0 && <span className="ml-2 numeral text-gold-deep">{draft[g.key].length}</span>}
                      </span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform duration-500", section === g.key && "rotate-180")} strokeWidth={1.2} />
                    </button>
                    <AnimatePresence initial={false}>
                      {section === g.key && (
                        <motion.ul initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                          {facets[g.key]?.map((o) => {
                            const on = draft[g.key].includes(o.value);
                            return (
                              <li key={o.value}>
                                <button onClick={() => toggle(g.key, o.value)} aria-pressed={on} className="flex w-full items-center gap-4 py-3 text-left">
                                  <span className={cn("grid h-4 w-4 place-items-center border", on ? "border-charcoal bg-charcoal" : "border-line")}>
                                    {on && <Check className="h-3 w-3 text-ivory" strokeWidth={2} />}
                                  </span>
                                  <span className="font-display text-xl">{o.label}</span>
                                  <span className="numeral ml-auto text-sm text-muted">{o.count}</span>
                                </button>
                              </li>
                            );
                          })}
                          <li className="h-4" />
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </div>
            {open === "filter" && (
              <div className="grid grid-cols-[auto_1fr] gap-3 border-t border-line p-4" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
                <button onClick={() => setDraft({ ...draft, category: [], gender: [], shape: [], collection: [] })} className="h-13 px-5 eyebrow text-[0.6rem] text-muted">
                  Clear
                </button>
                <button onClick={() => onApply(draft)} className="h-13 bg-charcoal py-4 eyebrow text-[0.62rem] text-ivory">
                  Show pieces
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
