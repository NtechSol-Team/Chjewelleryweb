"use client";

import { MotionConfig } from "framer-motion";

/** Framer Motion honours the OS reduced-motion preference everywhere. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </MotionConfig>
  );
}
