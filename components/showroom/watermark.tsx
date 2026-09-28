"use client";

import { useMemo } from "react";
import { useShowroom } from "./showroom-context";
import { cn } from "@/lib/cn";

/**
 * Dynamic, traceable watermark tiled across sensitive media. Text is drawn in
 * white with a difference blend so it stays equally faint on light and dark
 * photography. Deterrence and traceability only.
 */
export function Watermark({ className, density = "normal" }: { className?: string; density?: "normal" | "sparse" }) {
  const { client, watermark } = useShowroom();
  const tile = useMemo(() => {
    const w = density === "sparse" ? 520 : 380;
    const h = density === "sparse" ? 300 : 220;
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const line1 = esc(`CH JEWELS · PRIVATE VIEWING`);
    const line2 = esc(`${client.displayName.toUpperCase()} · ${client.sessionRef}`);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><g transform='rotate(-24 ${w / 2} ${h / 2})' fill='white' font-family='Helvetica, Arial, sans-serif' text-anchor='middle'><text x='${w / 2}' y='${h / 2 - 6}' font-size='11' letter-spacing='3.2'>${line1}</text><text x='${w / 2}' y='${h / 2 + 12}' font-size='9' letter-spacing='2.4'>${line2}</text></g></svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  }, [client.displayName, client.sessionRef, density]);

  if (!watermark.enabled) return null;
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 z-[2] select-none", className)}
      style={{ backgroundImage: tile, opacity: watermark.opacity * 1.6, mixBlendMode: "difference" }}
    />
  );
}
