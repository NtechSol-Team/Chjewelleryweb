"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const KEY = "chj_intro_seen";

/** First-entry loader: wordmark and a single gold line. Once per browser session. */
export function IntroLoader() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
      sessionStorage.setItem(KEY, "1");
    } catch {}
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => setShow(false), seen || reduced ? 0 : 2100);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ivory"
          exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.65, 0, 0.35, 1] } }}
          aria-busy="true"
          aria-label="Preparing your private showroom"
        >
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.5em" }}
            animate={{ opacity: 1, letterSpacing: "0.34em" }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-display pl-[0.34em] text-[2rem] text-charcoal sm:text-[2.6rem]"
          >
            CH JEWELS
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-4 eyebrow text-[0.6rem] text-muted"
          >
            Private Showroom
          </motion.p>
          <div className="mt-10 h-px w-40 overflow-hidden bg-line">
            <motion.div
              className="h-full origin-left bg-champagne"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.8, ease: [0.65, 0, 0.35, 1] }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
