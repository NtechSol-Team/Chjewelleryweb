"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useShowroom } from "./showroom-context";
import { LineLottie } from "@/components/animations/line-lottie";

/** Quiet confirmation after shortlisting — a ribbon, not a popup. */
export function ShortlistToast() {
  const { lastSaved } = useShowroom();
  const [dismissedAt, setDismissedAt] = useState(0);
  const visible = lastSaved && lastSaved.at !== dismissedAt ? lastSaved : null;

  useEffect(() => {
    if (!lastSaved) return;
    const t = window.setTimeout(() => setDismissedAt(lastSaved.at), 3400);
    return () => window.clearTimeout(t);
  }, [lastSaved]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[65] flex justify-center px-4 md:bottom-8">
      <AnimatePresence>
        {visible && (
          <motion.div
            key={visible.at}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            className="pointer-events-auto flex items-center gap-4 bg-charcoal py-3 pl-3 pr-6 text-ivory shadow-[0_24px_60px_-30px_rgba(12,12,11,0.7)]"
          >
            {visible.saved ? <LineLottie kind="success" size={36} color="#d8c08a" /> : <span className="w-2" />}
            <span className="eyebrow text-[0.6rem]">{visible.saved ? "Added to shortlist" : "Removed from shortlist"}</span>
            <span className="numeral text-sm text-ivory/60">{visible.code}</span>
            {visible.saved && (
              <Link href="/shortlist" className="ml-2 border-l border-ivory/20 pl-4 eyebrow text-[0.58rem] text-soft-gold hover:text-ivory">
                View
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
