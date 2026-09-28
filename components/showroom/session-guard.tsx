"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Monogram } from "@/components/ui/brand";

const HEARTBEAT_MS = 60_000;
const WARN_BEFORE_MS = 2 * 60_000;

/**
 * Keeps the open tab honest about its session: detects revocation (single
 * session / advisor logout / disablement) and gently warns before the idle
 * timeout closes the showroom.
 */
export function SessionGuard({ idleMinutes }: { idleMinutes: number }) {
  const router = useRouter();
  const lastActivity = useRef(0);
  const [warning, setWarning] = useState<number | null>(null);

  useEffect(() => {
    lastActivity.current = Date.now();
    let lastReported = Date.now();
    const markActive = () => {
      lastActivity.current = Date.now();
    };
    const events = ["pointerdown", "keydown", "scroll", "touchstart", "wheel"] as const;
    events.forEach((e) => window.addEventListener(e, markActive, { passive: true }));

    const ping = async (forceActive = false) => {
      const active = forceActive || lastActivity.current > lastReported;
      lastReported = Date.now();
      try {
        const res = await fetch("/api/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ active }),
          cache: "no-store",
        });
        if (res.status === 401) {
          const { reason } = await res.json();
          router.replace(`/access?reason=${reason ?? "session-expired"}`);
        }
      } catch {
        // Offline: the network notice handles messaging; try again next beat.
      }
    };

    const beat = window.setInterval(() => ping(), HEARTBEAT_MS);
    const tick = window.setInterval(() => {
      const idleFor = Date.now() - lastActivity.current;
      const left = idleMinutes * 60_000 - idleFor;
      if (left <= 0) {
        router.replace("/access?reason=session-expired");
      } else if (left <= WARN_BEFORE_MS) {
        setWarning(Math.ceil(left / 1000));
      } else {
        setWarning(null);
      }
    }, 1000);

    const onVisible = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      events.forEach((e) => window.removeEventListener(e, markActive));
      window.clearInterval(beat);
      window.clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [idleMinutes, router]);

  const stay = async () => {
    lastActivity.current = Date.now();
    setWarning(null);
    await fetch("/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ active: true }) });
  };

  return (
    <AnimatePresence>
      {warning !== null && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/30 px-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="idle-title"
            aria-describedby="idle-body"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            className="w-full max-w-md bg-ivory px-10 py-12 text-center shadow-[0_40px_80px_-40px_rgba(12,12,11,0.5)]"
          >
            <Monogram className="mx-auto h-10 w-10" />
            <p id="idle-title" className="mt-6 eyebrow text-gold-deep">
              Private Session
            </p>
            <p id="idle-body" className="display mt-4 text-[1.9rem] leading-tight">
              For your privacy, this session will close in{" "}
              <span className="numeral">
                {Math.floor(warning / 60)}:{String(warning % 60).padStart(2, "0")}
              </span>
              .
            </p>
            <button onClick={stay} autoFocus className="mt-10 h-13 w-full bg-charcoal py-4 eyebrow text-[0.66rem] text-ivory hover:bg-ink">
              Continue Viewing
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
