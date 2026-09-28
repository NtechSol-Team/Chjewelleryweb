"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { lottieDiamond, lottieLock, lottieSuccess } from "@/lib/lottie-data";

// The "light" build: svg renderer only, no expression engine — smallest bundle.
const Lottie = dynamic(() => import("lottie-react").then((m) => m.LottieLight), { ssr: false, loading: () => null });

type Kind = "success" | "diamond" | "diamond-loop" | "lock";

/**
 * Lottie is reserved for meaningful micro-moments only: confirmation,
 * security state, loading and empty states.
 */
export function LineLottie({ kind, size = 72, color, className, label }: { kind: Kind; size?: number; color?: string; className?: string; label?: string }) {
  const reduced = useReducedMotion();
  const data = useMemo(() => {
    switch (kind) {
      case "success":
        return lottieSuccess(color);
      case "lock":
        return lottieLock(color);
      case "diamond-loop":
        return lottieDiamond(color, true);
      default:
        return lottieDiamond(color);
    }
  }, [kind, color]);

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Lottie
        src={data}
        loop={kind === "diamond-loop" && !reduced}
        autoplay
        segment={reduced ? [data.op - 1, data.op] : undefined}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
