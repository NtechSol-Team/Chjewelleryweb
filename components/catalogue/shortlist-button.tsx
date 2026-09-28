"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart } from "lucide-react";
import { useShowroom } from "@/components/showroom/showroom-context";
import { cn } from "@/lib/cn";

/** Compact heart used on cards. */
export function ShortlistHeart({ id, code, className, tone = "dark" }: { id: string; code: string; className?: string; tone?: "dark" | "light" }) {
  const { isShortlisted, toggle } = useShowroom();
  const saved = isShortlisted(id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id, code);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${code} from shortlist` : `Add ${code} to shortlist`}
      className={cn(
        "grid h-10 w-10 place-items-center transition-colors duration-500",
        tone === "light" ? "text-ivory" : "text-charcoal",
        className,
      )}
    >
      <motion.span key={String(saved)} initial={{ scale: 0.7, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
        <Heart
          className={cn("h-[18px] w-[18px] transition-colors duration-500", saved && "fill-champagne text-champagne")}
          strokeWidth={1.1}
        />
      </motion.span>
    </button>
  );
}

/** Primary CTA on the piece page: ♡ SHORTLIST PIECE → ✓ ADDED TO SHORTLIST */
export function ShortlistCTA({ id, code, className }: { id: string; code: string; className?: string }) {
  const { isShortlisted, toggle } = useShowroom();
  const saved = isShortlisted(id);
  return (
    <button
      type="button"
      onClick={() => toggle(id, code)}
      aria-pressed={saved}
      className={cn(
        "group relative flex h-15 w-full items-center justify-center gap-3 overflow-hidden py-5 eyebrow text-[0.66rem] transition-colors duration-700",
        saved ? "border border-champagne bg-pearl text-charcoal" : "bg-charcoal text-ivory hover:bg-ink",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {saved ? (
          <motion.span key="saved" className="flex items-center gap-3" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }}>
            <Check className="h-4 w-4 text-gold-deep" strokeWidth={1.4} /> Added to Shortlist
          </motion.span>
        ) : (
          <motion.span key="idle" className="flex items-center gap-3" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }}>
            <Heart className="h-4 w-4" strokeWidth={1.2} /> Shortlist Piece
          </motion.span>
        )}
      </AnimatePresence>
      {!saved && (
        <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-champagne transition-transform duration-700 ease-[var(--ease-lux)] group-hover:scale-x-100" />
      )}
    </button>
  );
}
