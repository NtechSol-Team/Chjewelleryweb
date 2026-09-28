import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "light" | "ghost";

const base =
  "group relative inline-flex items-center justify-center gap-3 overflow-hidden eyebrow text-[0.68rem] transition-colors duration-500 ease-[var(--ease-lux)] disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "h-14 px-10 bg-charcoal text-ivory hover:bg-ink",
  outline: "h-14 px-10 border border-charcoal/70 text-charcoal hover:border-charcoal hover:bg-charcoal hover:text-ivory",
  light: "h-14 px-10 border border-ivory/50 text-ivory hover:border-ivory hover:bg-ivory hover:text-charcoal",
  ghost: "h-11 px-4 text-charcoal hover:text-gold-deep",
};

function Sheen({ variant }: { variant: Variant }) {
  if (variant !== "primary") return null;
  // A single gold hairline that sweeps across the base on hover.
  return (
    <span
      aria-hidden
      className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-champagne transition-transform duration-700 ease-[var(--ease-lux)] group-hover:scale-x-100"
    />
  );
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      <Sheen variant={variant} />
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return (
    <Link className={cn(base, variants[variant], className)} {...props}>
      <Sheen variant={variant} />
      {children}
    </Link>
  );
}

/** "VIEW COLLECTION →" — hairline expands in gold, arrow drifts right. */
export function LuxLink({
  children,
  className,
  arrow = true,
  ...props
}: ComponentProps<typeof Link> & { arrow?: boolean; children: ReactNode }) {
  return (
    <Link className={cn("lux-link eyebrow text-[0.68rem]", className)} {...props}>
      <span>{children}</span>
      {arrow && <ArrowRight className="lux-arrow h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />}
      <span className="lux-line" aria-hidden />
    </Link>
  );
}
