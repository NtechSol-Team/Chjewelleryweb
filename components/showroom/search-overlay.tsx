"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Search, X } from "lucide-react";
import { searchPieces } from "@/lib/actions/shortlist";
import { CATEGORIES, categoryLabel } from "@/lib/taxonomy";

type Result = Awaited<ReturnType<typeof searchPieces>>[number];

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => input.current?.focus(), 150);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (q.trim().length < 2) return;
    const t = window.setTimeout(() => start(async () => setResults(await searchPieces(q))), 220);
    return () => window.clearTimeout(t);
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    onClose();
    router.push(`/jewellery?q=${encodeURIComponent(q.trim())}`);
  };

  const showResults = q.trim().length >= 2;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Search your collection"
          className="fixed inset-0 z-[70] overflow-y-auto bg-ivory"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex h-[var(--header-h)] items-center justify-between px-gutter">
            <p className="eyebrow text-[0.62rem] text-muted">Search · Your Private Catalogue</p>
            <button onClick={onClose} className="grid h-11 w-11 place-items-center hover:opacity-60" aria-label="Close search">
              <X className="h-5 w-5" strokeWidth={1.2} />
            </button>
          </div>

          <motion.form
            onSubmit={submit}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.9 }}
            className="mx-auto mt-10 max-w-5xl px-gutter md:mt-20"
          >
            <label className="relative block">
              <span className="sr-only">Search by name, reference or category</span>
              <Search className="absolute left-0 top-1/2 h-6 w-6 -translate-y-1/2 text-muted" strokeWidth={1} />
              <input
                ref={input}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  if (e.target.value.trim().length < 2) setResults([]);
                }}
                placeholder="Search by name, reference or stone"
                className="w-full border-b border-line bg-transparent py-5 pl-11 font-display text-[1.9rem] font-light text-charcoal outline-none placeholder:text-muted/40 focus:border-champagne sm:text-[2.8rem]"
              />
              {pending && <span className="absolute inset-x-0 bottom-0 h-px origin-left bg-champagne" style={{ animation: "loader-line 1.2s var(--ease-silk) infinite" }} />}
            </label>

            {!showResults && (
              <div className="mt-12">
                <p className="eyebrow text-[0.6rem] text-muted">Browse by category</p>
                <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
                  {CATEGORIES.map((c) => (
                    <Link
                      key={c.code}
                      href={`/jewellery?category=${c.code}`}
                      onClick={onClose}
                      className="nav-link font-display text-2xl text-charcoal/80 hover:text-charcoal"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {showResults && (
              <div className="mt-10" aria-live="polite">
                {results.length === 0 && !pending ? (
                  <div className="py-16 text-center">
                    <p className="eyebrow text-charcoal">No pieces found</p>
                    <p className="mt-3 font-display text-2xl text-muted">Try a reference such as R-1024, or a stone.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-line">
                    {results.map((r, i) => (
                      <motion.li key={r.code} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                        <Link href={`/product/${r.code}`} onClick={onClose} className="group flex items-center gap-6 py-4">
                          <span className="relative h-20 w-16 shrink-0 overflow-hidden bg-cream">
                            {r.image && <Image src={r.image} alt="" fill sizes="64px" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="eyebrow text-[0.58rem] text-gold-deep">{r.code}</span>
                            <span className="mt-1 block truncate font-display text-2xl">{r.name}</span>
                            <span className="caption text-muted">{categoryLabel(r.category)}</span>
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted transition-transform duration-500 group-hover:translate-x-1.5" strokeWidth={1.2} />
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                )}
                {results.length > 0 && (
                  <button type="submit" className="mt-8 lux-link eyebrow text-[0.64rem]">
                    <span>View all results</span>
                    <ArrowRight className="lux-arrow h-3.5 w-3.5" strokeWidth={1.25} />
                    <span className="lux-line" />
                  </button>
                )}
              </div>
            )}
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
