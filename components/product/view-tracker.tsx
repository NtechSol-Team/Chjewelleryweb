"use client";

import { useEffect } from "react";

const BEAT_MS = 15_000;

/**
 * Records approximate foreground viewing time for a piece: time only
 * accumulates while the tab is visible. Feeds the admin engagement analytics.
 */
export function ViewTracker({ productId, code }: { productId: string; code: string }) {
  useEffect(() => {
    const viewId = crypto.randomUUID();
    let visibleSince = document.visibilityState === "visible" ? Date.now() : null;
    let started = false;

    const take = () => {
      if (visibleSince === null) return 0;
      const now = Date.now();
      const delta = Math.min(now - visibleSince, 60_000);
      visibleSince = now;
      return delta;
    };

    const send = (deltaMs: number, beacon = false) => {
      const body = JSON.stringify({ viewId, productId, deltaMs, start: !started, code });
      started = true;
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon("/api/views", new Blob([body], { type: "application/json" }));
      } else {
        fetch("/api/views", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
      }
    };

    // A short delay ignores bounces (and React's dev double-mount).
    const startTimer = window.setTimeout(() => send(0), 800);
    const beat = window.setInterval(() => {
      const d = take();
      if (started && d > 0) send(d);
    }, BEAT_MS);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (started) send(take(), true);
        visibleSince = null;
      } else {
        visibleSince = Date.now();
      }
    };
    const onHide = () => started && send(take(), true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);

    return () => {
      window.clearTimeout(startTimer);
      window.clearInterval(beat);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
      const d = take();
      if (started && d > 0) send(d, true);
    };
  }, [productId, code]);

  return null;
}
