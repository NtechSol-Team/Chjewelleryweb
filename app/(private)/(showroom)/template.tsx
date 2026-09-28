"use client";

import { motion } from "framer-motion";
import { Monogram } from "@/components/ui/brand";

/**
 * Page transition (~700ms): an ivory veil carrying the monogram lifts away as
 * the next page fades in. Opacity-only on the page wrapper so fixed/sticky
 * descendants keep working.
 */
export default function ShowroomTemplate({ children }: { children: React.ReactNode }) {
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[45] flex items-center justify-center bg-ivory"
        initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
        animate={{ clipPath: "inset(0% 0% 100% 0%)" }}
        transition={{ duration: 0.75, delay: 0.18, ease: [0.65, 0, 0.35, 1] }}
      >
        <motion.span initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Monogram className="h-10 w-10" />
        </motion.span>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.25 }}>
        {children}
      </motion.div>
    </>
  );
}
