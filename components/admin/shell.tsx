"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  ExternalLink,
  Gem,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  MonitorSmartphone,
  Settings,
  Users,
  X,
} from "lucide-react";
import { adminLogout } from "@/lib/actions/admin";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/products", label: "Products", icon: Gem },
  { href: "/admin/collections", label: "Collections", icon: Layers },
  { href: "/admin/assignments", label: "Catalogue Assignment", icon: Link2 },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/activity", label: "Activity", icon: Activity },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/sessions", label: "Sessions", icon: MonitorSmartphone },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ admin, liveSessions, children }: { admin: { name: string; role: string }; liveSessions: number; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Close the mobile drawer on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const nav = (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-9 items-center gap-3 rounded-md px-3 text-[13px] transition-colors",
                  active ? "bg-white/[0.08] text-white" : "text-white/60 hover:bg-white/[0.04] hover:text-white",
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-soft-gold" : "text-white/50 group-hover:text-white/80")} strokeWidth={1.6} />
                <span className="flex-1">{label}</span>
                {href === "/admin/sessions" && liveSessions > 0 && (
                  <span className="rounded bg-ok/25 px-1.5 text-[11px] font-medium text-[#9fd3b1]" aria-label={`${liveSessions} live`}>
                    {liveSessions}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const brand = (
    <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
      <span className="font-display text-[1.35rem] tracking-[0.14em] text-white">CH</span>
      <span className="h-4 w-px bg-champagne/70" />
      <span className="text-[10.5px] font-medium uppercase tracking-[0.3em] text-white/70">Atelier Console</span>
    </div>
  );

  const footer = (
    <div className="border-t border-white/10 p-3">
      <Link href="/login" target="_blank" className="mb-2 flex h-9 items-center gap-3 rounded-md px-3 text-[12.5px] text-white/60 hover:bg-white/[0.04] hover:text-white">
        <ExternalLink className="h-4 w-4" strokeWidth={1.6} /> Open client showroom
      </Link>
      <div className="flex items-center gap-3 rounded-md px-3 py-2">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-champagne/20 text-[11px] font-semibold text-soft-gold">
          {admin.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-medium text-white">{admin.name}</p>
          <p className="truncate text-[11px] text-white/50">{admin.role}</p>
        </div>
        <form action={adminLogout}>
          <button className="grid h-8 w-8 place-items-center rounded-md text-white/50 hover:bg-white/10 hover:text-white" aria-label="Sign out" title="Sign out">
            <LogOut className="h-4 w-4" strokeWidth={1.6} />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-a-bg font-ui text-a-text">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col bg-charcoal lg:flex">
        {brand}
        {nav}
        {footer}
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-a-line bg-a-surface px-4 lg:hidden">
        <button onClick={() => setOpen(true)} className="grid h-9 w-9 place-items-center rounded-md hover:bg-a-subtle" aria-label="Open navigation">
          <Menu className="h-5 w-5" strokeWidth={1.6} />
        </button>
        <span className="font-display text-lg tracking-[0.14em]">CH <span className="font-ui text-[10px] tracking-[0.3em] text-a-muted">CONSOLE</span></span>
        <span className="w-9" />
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-ink/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col bg-charcoal lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <button onClick={() => setOpen(false)} className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-md text-white/60 hover:bg-white/10" aria-label="Close navigation">
                <X className="h-4 w-4" />
              </button>
              {brand}
              {nav}
              {footer}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="lg:pl-[248px]">{children}</main>
    </div>
  );
}
