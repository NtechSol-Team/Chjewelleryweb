"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Ban, Copy, Eye, KeyRound, Link2, MoreHorizontal, Pencil, Power, ShieldCheck } from "lucide-react";
import { forceLogout, resetClientPassword, setClientStatus } from "@/lib/actions/admin";
import { Dialog, Toast } from "./dialog";
import { AButton } from "./ui";
import { cn } from "@/lib/cn";

type Confirm = "disable" | "enable" | "logout" | "reset" | null;

export function ClientActions({ id, name, status, online, variant = "menu" }: { id: string; name: string; status: "active" | "disabled"; online: boolean; variant?: "menu" | "buttons" }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [temp, setTemp] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !menu.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const run = () =>
    start(async () => {
      if (confirm === "disable" || confirm === "enable") {
        await setClientStatus(id, confirm === "disable" ? "disabled" : "active");
        setToast(confirm === "disable" ? `${name} disabled and signed out` : `${name} re-enabled`);
        setConfirm(null);
      } else if (confirm === "logout") {
        const r = await forceLogout(id);
        setToast(r.revoked ? `${name} was signed out` : "No active session to end");
        setConfirm(null);
      } else if (confirm === "reset") {
        const r = await resetClientPassword(id);
        setTemp(r.password);
      }
    });

  const items = [
    { key: "view", label: "View profile", icon: Eye, href: `/admin/clients/${id}` },
    { key: "edit", label: "Edit details", icon: Pencil, href: `/admin/clients/${id}#edit` },
    { key: "assign", label: "Assign catalogue", icon: Link2, href: `/admin/assignments?client=${id}` },
    { key: "logout", label: "Force logout", icon: Power, action: () => setConfirm("logout"), disabled: !online },
    { key: "reset", label: "Reset password", icon: KeyRound, action: () => setConfirm("reset") },
    status === "active"
      ? { key: "disable", label: "Disable account", icon: Ban, action: () => setConfirm("disable"), danger: true }
      : { key: "enable", label: "Enable account", icon: ShieldCheck, action: () => setConfirm("enable") },
  ];

  const copy = {
    disable: { t: `Disable ${name}?`, d: "Their current session ends immediately and they will not be able to sign in until re-enabled.", cta: "Disable account", danger: true },
    enable: { t: `Re-enable ${name}?`, d: "They will be able to sign in again with their existing credentials.", cta: "Enable account", danger: false },
    logout: { t: `End ${name}'s session?`, d: "The showroom closes in their browser within a minute. They can sign in again.", cta: "Force logout", danger: true },
    reset: { t: `Reset password for ${name}?`, d: "A one-time password will be generated and any active session ended. Share it with the client securely.", cta: "Generate password", danger: false },
  };

  const dialog = confirm && (
    <Dialog
      open={!!confirm}
      onClose={() => {
        setConfirm(null);
        setTemp(null);
      }}
      title={temp ? "New password generated" : copy[confirm].t}
      description={temp ? "It will not be shown again." : copy[confirm].d}
      footer={
        temp ? (
          <AButton variant="primary" onClick={() => { setConfirm(null); setTemp(null); }}>
            Done
          </AButton>
        ) : (
          <>
            <AButton onClick={() => setConfirm(null)}>Cancel</AButton>
            <AButton variant={copy[confirm].danger ? "danger" : "primary"} onClick={run} disabled={pending}>
              {pending ? "Working…" : copy[confirm].cta}
            </AButton>
          </>
        )
      }
    >
      {temp && (
        <div className="flex items-center justify-between rounded-md border border-a-line bg-a-subtle px-4 py-3">
          <code className="text-[15px] font-semibold tracking-wider">{temp}</code>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(temp);
              setToast("Password copied");
            }}
            className="flex items-center gap-1.5 text-[12px] text-a-muted hover:text-a-text"
          >
            <Copy className="h-3.5 w-3.5" /> Copy
          </button>
        </div>
      )}
    </Dialog>
  );

  if (variant === "buttons") {
    return (
      <div className="flex flex-wrap gap-2">
        <AButton onClick={() => setConfirm("logout")} disabled={!online}>
          <Power className="h-3.5 w-3.5" /> Force logout
        </AButton>
        <AButton onClick={() => setConfirm("reset")}>
          <KeyRound className="h-3.5 w-3.5" /> Reset password
        </AButton>
        {status === "active" ? (
          <AButton variant="danger" onClick={() => setConfirm("disable")}>
            <Ban className="h-3.5 w-3.5" /> Disable
          </AButton>
        ) : (
          <AButton onClick={() => setConfirm("enable")}>
            <ShieldCheck className="h-3.5 w-3.5" /> Enable
          </AButton>
        )}
        {dialog}
        <Toast message={toast} onDone={() => setToast(null)} />
      </div>
    );
  }

  return (
    <div ref={menu} className="relative inline-block">
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={`Actions for ${name}`} className="grid h-8 w-8 place-items-center rounded-md text-a-muted hover:bg-a-subtle hover:text-a-text">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-9 z-30 w-52 rounded-md border border-a-line bg-white py-1 text-left shadow-lg"
          >
            {items.map((it) => (
              <li key={it.key} role="none">
                {"href" in it && it.href ? (
                  <Link role="menuitem" href={it.href} className="flex h-9 items-center gap-2.5 px-3 text-[13px] hover:bg-a-subtle">
                    <it.icon className="h-3.5 w-3.5 text-a-muted" /> {it.label}
                  </Link>
                ) : (
                  <button
                    role="menuitem"
                    disabled={"disabled" in it && it.disabled}
                    onClick={() => {
                      setOpen(false);
                      if ("action" in it) it.action?.();
                    }}
                    className={cn("flex h-9 w-full items-center gap-2.5 px-3 text-[13px] hover:bg-a-subtle disabled:opacity-40", "danger" in it && it.danger && "text-danger")}
                  >
                    <it.icon className="h-3.5 w-3.5" /> {it.label}
                  </button>
                )}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      {dialog}
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
