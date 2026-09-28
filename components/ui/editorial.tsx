import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { LineLottie } from "@/components/animations/line-lottie";

export function Eyebrow({ children, className, gold }: { children: ReactNode; className?: string; gold?: boolean }) {
  return <p className={cn("eyebrow", gold ? "text-gold-deep" : "text-muted", className)}>{children}</p>;
}

/** 01 ———— SIGNATURE PIECES */
export function SectionMark({ n, label, className, tone = "dark" }: { n: number | string; label: string; className?: string; tone?: "dark" | "light" }) {
  return (
    <div className={cn("flex items-center gap-4", tone === "light" ? "text-ivory/80" : "text-muted", className)}>
      <span className="numeral text-sm text-gold-deep data-[tone=light]:text-soft-gold" data-tone={tone}>
        {typeof n === "number" ? String(n).padStart(2, "0") : n}
      </span>
      <span className={cn("h-px w-10", tone === "light" ? "bg-ivory/40" : "bg-line")} />
      <span className="eyebrow">{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  className,
  icon = "diamond",
}: {
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
  icon?: "diamond" | "lock";
}) {
  return (
    <div className={cn("mx-auto flex max-w-md flex-col items-center py-24 text-center md:py-32", className)}>
      <LineLottie kind={icon} size={84} />
      <h2 className="mt-8 eyebrow text-charcoal">{title}</h2>
      <p className="mt-4 font-display text-2xl leading-snug text-muted md:text-[1.7rem]">{body}</p>
      {action && <div className="mt-10">{action}</div>}
    </div>
  );
}

export function Spec({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,9rem)_1fr] gap-6 border-t border-line py-4 first:border-t-0">
      <dt className="eyebrow text-[0.62rem] text-muted">{label}</dt>
      <dd className="text-[0.9rem] leading-relaxed text-charcoal">{value}</dd>
    </div>
  );
}
