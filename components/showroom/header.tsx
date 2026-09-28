"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, User, X } from "lucide-react";
import { Wordmark } from "@/components/ui/brand";
import { cn } from "@/lib/cn";
import { useShowroom } from "./showroom-context";
import { SearchOverlay } from "./search-overlay";
import { clientLogout } from "@/lib/actions/client-auth";

const NAV = [
  { href: "/collections", label: "Collections" },
  { href: "/jewellery", label: "Jewellery" },
  { href: "/new-arrivals", label: "New Arrivals" },
  { href: "/shortlist", label: "Shortlist" },
];

export function Header() {
  const pathname = usePathname();
  const { client, shortlistCount } = useShowroom();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Pages that open on a full-bleed dark image start with a transparent header.
  const overImage = pathname === "/catalogue" || /^\/collections\/[^/]+$/.test(pathname);
  const solid = scrolled || !overImage || menuOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tone = solid ? "text-charcoal" : "text-ivory";

  return (
    <>
      <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ivory focus:px-4 focus:py-2">
        Skip to content
      </a>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,color] duration-700 ease-[var(--ease-lux)]",
          solid ? "border-b border-line/70 bg-ivory/92 backdrop-blur-md" : "border-b border-transparent bg-transparent",
          tone,
        )}
      >
        <div className="flex h-[var(--header-h)] items-center justify-between gap-6 px-gutter">
          <Link href="/catalogue" className="shrink-0" aria-label="CH Jewels — collection home">
            <Wordmark tone={solid ? "dark" : "light"} className="text-[0.82rem] sm:text-[0.9rem]" />
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-10 xl:gap-14">
              {NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link href={item.href} aria-current={active ? "page" : undefined} className="nav-link eyebrow text-[0.64rem]">
                      {item.label}
                      {item.href === "/shortlist" && shortlistCount > 0 && (
                        <sup className="ml-1 numeral text-[0.7rem] tracking-normal text-gold-deep" aria-label={`${shortlistCount} saved`}>
                          {shortlistCount}
                        </sup>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-1 sm:gap-3">
            <p className={cn("mr-3 hidden items-center gap-2 eyebrow text-[0.56rem] xl:flex", solid ? "text-muted" : "text-ivory/70")}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-champagne opacity-40" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-champagne" />
              </span>
              Private Viewing · {client.shortName}
            </p>
            <button onClick={() => setSearchOpen(true)} className="grid h-11 w-11 place-items-center transition-opacity hover:opacity-60" aria-label="Search your collection">
              <Search className="h-[18px] w-[18px]" strokeWidth={1.2} />
            </button>
            <Link href="/profile" className="hidden h-11 w-11 place-items-center transition-opacity hover:opacity-60 md:grid" aria-label="Your profile and access">
              <User className="h-[18px] w-[18px]" strokeWidth={1.2} />
            </Link>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="grid h-11 w-11 place-items-center lg:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? <X className="h-5 w-5" strokeWidth={1.2} /> : <Menu className="h-5 w-5" strokeWidth={1.2} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col bg-ivory px-gutter pb-10 pt-[calc(var(--header-h)+2.5rem)] lg:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
          >
            <nav aria-label="Mobile">
              <ul className="space-y-2">
                {[...NAV, { href: "/profile", label: "Profile" }].map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.06, duration: 0.9 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-baseline gap-5 border-b border-line py-4"
                    >
                      <span className="numeral text-sm text-gold-deep">{String(i + 1).padStart(2, "0")}</span>
                      <span className="display text-[2.4rem] leading-none sm:text-[3rem]">{item.label}</span>
                      {item.href === "/shortlist" && shortlistCount > 0 && <span className="numeral text-lg text-muted">({shortlistCount})</span>}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>
            <div className="mt-auto space-y-6">
              <div className="flex items-center gap-2 eyebrow text-[0.58rem] text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-champagne" />
                Private Viewing · {client.displayName} · Session {client.sessionRef}
              </div>
              <form action={clientLogout}>
                <button className="eyebrow text-[0.64rem] text-charcoal underline decoration-line underline-offset-8">Sign out securely</button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
