"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WifiOff } from "lucide-react";

const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

/** Network failure state — a quiet ribbon, never an alert box. */
export function NetworkNotice() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          role="status"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className="fixed inset-x-0 bottom-6 z-[80] mx-auto flex w-fit items-center gap-3 bg-charcoal px-6 py-3.5 text-ivory shadow-lg"
        >
          <WifiOff className="h-4 w-4 text-soft-gold" strokeWidth={1.25} />
          <span className="eyebrow text-[0.6rem]">Connection paused</span>
          <span className="hidden text-[0.78rem] text-ivory/70 sm:inline">The showroom will resume when you are back online.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
