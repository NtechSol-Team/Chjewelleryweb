import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/* Admin design language: Inter, 13–14px, neutral surfaces, hairlines, a single
   gold accent. Efficient and data-first — deliberately unlike the showroom. */

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: ReactNode; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="flex flex-col gap-4 border-b border-a-line bg-a-surface px-5 py-6 md:flex-row md:items-end md:justify-between md:px-8">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-a-muted">{eyebrow}</p>}
        <h1 className="truncate text-[22px] font-semibold tracking-tight text-a-text">{title}</h1>
        {description && <p className="mt-1 text-[13px] text-a-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, actions, children, className, bodyClassName }: { title?: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={cn("rounded-md border border-a-line bg-a-surface", className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 border-b border-a-line px-5 py-4">
          <div>
            {title && <h2 className="text-[14px] font-semibold text-a-text">{title}</h2>}
            {description && <p className="mt-0.5 text-[12px] text-a-muted">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatTile({ label, value, hint, icon, accent }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; accent?: boolean }) {
  return (
    <div className={cn("rounded-md border border-a-line bg-a-surface p-4 md:p-5", accent && "border-champagne/50")}>
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium text-a-muted">{label}</p>
        {icon && <span className="text-a-muted">{icon}</span>}
      </div>
      <p className="mt-3 text-[26px] font-semibold tracking-tight text-a-text md:text-[28px]">{value}</p>
      {hint && <p className="mt-1 text-[12px] text-a-muted">{hint}</p>}
    </div>
  );
}

type Tone = "ok" | "warn" | "danger" | "neutral" | "gold";
const tones: Record<Tone, string> = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-a-subtle text-a-muted",
  gold: "bg-[#f6eedb] text-gold-deep",
};

/** Status always pairs colour with a dot and a word — never colour alone. */
export function Badge({ tone = "neutral", children, dot = true, className }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-0.5 text-[11.5px] font-medium", tones[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
const btn: Record<BtnVariant, string> = {
  primary: "bg-charcoal text-white hover:bg-ink border border-charcoal",
  secondary: "bg-a-surface text-a-text border border-a-line hover:border-a-muted/50 hover:bg-a-subtle",
  ghost: "text-a-text hover:bg-a-subtle border border-transparent",
  danger: "bg-a-surface text-danger border border-a-line hover:bg-danger-soft",
};
const btnBase =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-offset-2";

export function AButton({ variant = "secondary", className, ...props }: ComponentProps<"button"> & { variant?: BtnVariant }) {
  return <button className={cn(btnBase, btn[variant], className)} {...props} />;
}

export function ALink({ variant = "secondary", className, ...props }: ComponentProps<typeof Link> & { variant?: BtnVariant }) {
  return <Link className={cn(btnBase, btn[variant], className)} {...props} />;
}

export const inputClass =
  "h-9 w-full rounded-md border border-a-line bg-a-surface px-3 text-[13px] text-a-text outline-none transition-colors placeholder:text-a-muted/70 focus:border-charcoal/60 focus:ring-2 focus:ring-champagne/25 aria-[invalid=true]:border-danger";

/** Same control without the full-width default, for inline filter rows. */
export const inlineInput = inputClass.replace("w-full ", "");

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="text-[12px] font-medium text-a-text">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error ? <span className="mt-1 block text-[12px] text-danger">{error}</span> : hint ? <span className="mt-1 block text-[12px] text-a-muted">{hint}</span> : null}
    </label>
  );
}

export function Th({ children, className, align = "left" }: { children?: ReactNode; className?: string; align?: "left" | "right" }) {
  return <th className={cn("sticky top-0 z-[1] whitespace-nowrap border-b border-a-line bg-a-subtle/80 px-4 py-2.5 text-[11.5px] font-medium text-a-muted backdrop-blur", align === "right" ? "text-right" : "text-left", className)}>{children}</th>;
}
export function Td({ children, className, align = "left" }: { children?: ReactNode; className?: string; align?: "left" | "right" }) {
  return <td className={cn("border-b border-a-line px-4 py-3 align-middle text-[13px]", align === "right" && "text-right tabular", className)}>{children}</td>;
}

export function EmptyPanel({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <p className="text-[14px] font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] text-a-muted">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Initials({ name, className }: { name: string; className?: string }) {
  const parts = name.replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.)\s*/, "").split(" ");
  const ini = (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
  return (
    <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cream text-[11px] font-semibold text-gold-deep", className)} aria-hidden>
      {ini.toUpperCase()}
    </span>
  );
}
