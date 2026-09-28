"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import type { PieceCard } from "@/lib/catalogue";
import { categoryLabel } from "@/lib/taxonomy";
import { requestConsultation } from "@/lib/actions/shortlist";
import { useShowroom } from "@/components/showroom/showroom-context";
import { ShortlistHeart } from "./shortlist-button";
import { EmptyState } from "@/components/ui/editorial";
import { ButtonLink } from "@/components/ui/button";
import { LineLottie } from "@/components/animations/line-lottie";
import { cn } from "@/lib/cn";

const PREFERENCES = ["Private appointment", "Video consultation", "Call from my advisor"] as const;

export function ShortlistView({ items, advisor }: { items: { piece: PieceCard; added: string }[]; advisor: string | null }) {
  const { isShortlisted } = useShowroom();
  // Hide removed pieces immediately; the server confirms on revalidation.
  const visible = items.filter((i) => isShortlisted(i.piece.id));
  const [selected, setSelected] = useState<Set<string>>(() => new Set(items.map((i) => i.piece.id)));
  const [preference, setPreference] = useState<(typeof PREFERENCES)[number]>("Private appointment");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  const chosen = visible.filter((i) => selected.has(i.piece.id));

  if (visible.length === 0) {
    return (
      <EmptyState
        className="border-t border-line px-gutter"
        title="Shortlist is empty"
        body="Pieces you save for later discussion will appear here."
        action={<ButtonLink href="/collections">Explore Collection</ButtonLink>}
      />
    );
  }

  const submit = () =>
    start(async () => {
      setError(false);
      const res = await requestConsultation({ productIds: chosen.map((c) => c.piece.id), preference, message });
      if (res.ok) setSent(true);
      else setError(true);
    });

  return (
    <section className="grid gap-16 border-t border-line px-gutter pb-32 pt-10 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-7 xl:col-span-8">
        <div className="hidden grid-cols-[2rem_6rem_1fr_9rem_8rem_2.5rem] items-center gap-6 border-b border-line pb-4 eyebrow text-[0.54rem] text-muted md:grid">
          <span />
          <span>Piece</span>
          <span />
          <span>Category</span>
          <span>Added</span>
          <span />
        </div>
        <ul>
          <AnimatePresence initial={false}>
            {visible.map(({ piece, added }) => {
              const on = selected.has(piece.id);
              return (
                <motion.li
                  key={piece.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.6 }}
                  className="grid grid-cols-[2rem_5rem_1fr_2.5rem] items-center gap-4 border-b border-line py-6 md:grid-cols-[2rem_6rem_1fr_9rem_8rem_2.5rem] md:gap-6"
                >
                  <button
                    onClick={() =>
                      setSelected((s) => {
                        const n = new Set(s);
                        if (n.has(piece.id)) n.delete(piece.id);
                        else n.add(piece.id);
                        return n;
                      })
                    }
                    aria-pressed={on}
                    aria-label={on ? `Deselect ${piece.code}` : `Select ${piece.code} for discussion`}
                    className={cn("grid h-4 w-4 place-items-center border transition-colors", on ? "border-charcoal bg-charcoal" : "border-line hover:border-charcoal")}
                    disabled={sent}
                  >
                    {on && <Check className="h-3 w-3 text-ivory" strokeWidth={2} />}
                  </button>
                  <Link href={`/product/${piece.code}`} className="group relative block aspect-[4/5] overflow-hidden bg-cream">
                    {piece.image && <Image src={piece.image} alt="" fill sizes="96px" className="object-cover transition-transform duration-1000 group-hover:scale-105" />}
                  </Link>
                  <Link href={`/product/${piece.code}`} className="group min-w-0">
                    <p className="eyebrow text-[0.56rem] text-gold-deep">{piece.code}</p>
                    <p className="mt-1.5 font-display text-[1.45rem] leading-tight group-hover:text-gold-deep md:text-[1.7rem]">{piece.name}</p>
                    <p className="mt-1 caption text-muted md:hidden">
                      {categoryLabel(piece.category)} · Added {added}
                    </p>
                    <span className="mt-2 hidden items-center gap-2 eyebrow text-[0.52rem] text-muted opacity-0 transition-opacity group-hover:opacity-100 md:flex">
                      View piece <ArrowRight className="h-3 w-3" strokeWidth={1.2} />
                    </span>
                  </Link>
                  <p className="hidden text-[0.85rem] md:block">{categoryLabel(piece.category)}</p>
                  <p className="hidden text-[0.85rem] text-muted md:block">{added}</p>
                  <ShortlistHeart id={piece.id} code={piece.code} />
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
        <p className="mt-6 caption text-muted">
          {visible.length} {visible.length === 1 ? "piece" : "pieces"} saved · {chosen.length} selected for discussion
        </p>
      </div>

      <aside className="lg:col-span-5 xl:col-span-4">
        <div className="bg-pearl p-8 lg:sticky lg:top-[calc(var(--header-h)+2rem)] md:p-10">
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="sent" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-8 text-center">
                <LineLottie kind="success" size={84} label="Request sent" />
                <p className="mt-6 eyebrow text-gold-deep">Request Received</p>
                <p className="mt-4 font-display text-[1.8rem] leading-snug">
                  {advisor ?? "Your advisor"} will be in touch personally, usually within the day.
                </p>
                <p className="mt-4 text-[0.85rem] text-muted">
                  {chosen.length} {chosen.length === 1 ? "piece" : "pieces"} · {preference}
                </p>
              </motion.div>
            ) : (
              <motion.div key="form" exit={{ opacity: 0 }}>
                <p className="eyebrow text-[0.6rem] text-gold-deep">Personal Consultation</p>
                <h2 className="display mt-4 text-[2.2rem] leading-tight">Discuss selected pieces</h2>
                <fieldset className="mt-8">
                  <legend className="eyebrow text-[0.56rem] text-muted">How would you prefer to meet?</legend>
                  <div className="mt-4 space-y-1">
                    {PREFERENCES.map((p) => (
                      <label key={p} className="flex cursor-pointer items-center gap-4 py-2">
                        <input type="radio" name="preference" value={p} checked={preference === p} onChange={() => setPreference(p)} className="peer sr-only" />
                        <span className="grid h-4 w-4 place-items-center rounded-full border border-line peer-checked:border-charcoal peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-champagne">
                          <span className={cn("h-2 w-2 rounded-full transition-transform", preference === p ? "scale-100 bg-charcoal" : "scale-0")} />
                        </span>
                        <span className="font-display text-xl">{p}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="mt-8 block">
                  <span className="eyebrow text-[0.56rem] text-muted">A note for your advisor (optional)</span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    maxLength={1200}
                    className="mt-3 w-full resize-none border-b border-line bg-transparent pb-2 text-[0.92rem] outline-none focus:border-champagne"
                    placeholder="An occasion, a preferred date, a ring size…"
                  />
                </label>
                {error && <p className="mt-4 border-l border-champagne pl-3 text-[0.82rem]">Your request could not be sent. Please try again.</p>}
                <button
                  onClick={submit}
                  disabled={pending || chosen.length === 0}
                  className="mt-8 flex h-14 w-full items-center justify-center bg-charcoal eyebrow text-[0.64rem] text-ivory transition-colors hover:bg-ink disabled:opacity-40"
                >
                  {pending ? "Sending…" : `Discuss ${chosen.length} Selected ${chosen.length === 1 ? "Piece" : "Pieces"}`}
                </button>
                <p className="mt-4 text-center caption text-muted">No purchase is made. This simply notifies your advisor.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>
    </section>
  );
}
