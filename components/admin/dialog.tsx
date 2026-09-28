"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const noop = () => () => {};
/** True only after hydration, so portals never cause a server/client mismatch. */
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

/** Accessible modal: focus moves in, Escape closes, focus returns on close. */
export function Dialog({ open, onClose, title, description, children, footer }: { open: boolean; onClose: () => void; title: string; description?: ReactNode; children?: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => ref.current?.querySelector<HTMLElement>("input, textarea, button:not([data-close])")?.focus(), 30);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);

  const mounted = useMounted();
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/40 p-0 font-ui sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            className="w-full max-w-md rounded-t-lg bg-white shadow-2xl sm:rounded-lg"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-start justify-between gap-4 px-5 pt-5">
              <div>
                <h2 id="dialog-title" className="text-[15px] font-semibold">
                  {title}
                </h2>
                {description && <div className="mt-1 text-[13px] text-a-muted">{description}</div>}
              </div>
              <button data-close onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-a-muted hover:bg-a-subtle" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            {children && <div className="px-5 pt-4">{children}</div>}
            {footer && <div className="mt-5 flex justify-end gap-2 border-t border-a-line px-5 py-4">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Tiny toast for admin confirmations. */
export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [message, onDone]);
  const mounted = useMounted();
  if (!mounted) return null;
  return createPortal(
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[110] flex justify-center px-4 font-ui">
      <AnimatePresence>
        {message && (
          <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }} className="rounded-md bg-charcoal px-4 py-2.5 text-[13px] text-white shadow-lg">
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
