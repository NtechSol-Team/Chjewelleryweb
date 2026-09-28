"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Monogram } from "@/components/ui/brand";

/**
 * When the showroom loses focus or the tab is hidden, sensitive content is
 * softly veiled. A deterrent against casual capture — not a guarantee;
 * browsers cannot prevent screenshots.
 */
export function PrivacyShield({ enabled }: { enabled: boolean }) {
  const [veiled, setVeiled] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let blurTimer: number | undefined;
    const hide = () => {
      window.clearTimeout(blurTimer);
      setVeiled(true);
    };
    const show = () => {
      window.clearTimeout(blurTimer);
      setVeiled(false);
    };
    const onVisibility = () => (document.visibilityState === "hidden" ? hide() : show());
    // Small delay avoids flicker from transient focus changes (e.g. file pickers).
    const onBlur = () => {
      blurTimer = window.setTimeout(hide, 180);
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", show);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", show);
      window.clearTimeout(blurTimer);
    };
  }, [enabled]);

  return (
    <AnimatePresence>
      {veiled && (
        <motion.div
          className="fixed inset-0 z-[95] flex flex-col items-center justify-center bg-ivory/55 text-center"
          style={{ backdropFilter: "blur(28px) saturate(0.7)", WebkitBackdropFilter: "blur(28px) saturate(0.7)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          aria-live="polite"
        >
          <Monogram className="h-12 w-12" />
          <p className="mt-6 eyebrow text-charcoal">Private Content</p>
          <p className="mt-3 font-display text-2xl text-muted">Return to this window to continue viewing.</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
