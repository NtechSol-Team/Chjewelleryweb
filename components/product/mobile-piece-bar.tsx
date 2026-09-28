"use client";

import { Heart } from "lucide-react";
import { useShowroom } from "@/components/showroom/showroom-context";
import { cn } from "@/lib/cn";

/** Sticky mobile actions: ♡ SHORTLIST · VIEW DETAILS */
export function MobilePieceBar({ id, code }: { id: string; code: string }) {
  const { isShortlisted, toggle } = useShowroom();
  const saved = isShortlisted(id);
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-line bg-ivory/95 backdrop-blur-md lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <button onClick={() => toggle(id, code)} aria-pressed={saved} className="flex h-14 items-center justify-center gap-2 eyebrow text-[0.6rem]">
        <Heart className={cn("h-4 w-4 transition-colors", saved && "fill-champagne text-champagne")} strokeWidth={1.2} />
        {saved ? "Shortlisted" : "Shortlist"}
      </button>
      <a href="#details" className="flex h-14 items-center justify-center border-l border-line bg-charcoal eyebrow text-[0.6rem] text-ivory">
        View Details
      </a>
    </div>
  );
}
