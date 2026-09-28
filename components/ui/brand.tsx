import { cn } from "@/lib/cn";

/**
 * Text-based wordmark for CH JEWELS until final logo assets are supplied.
 * Never stretched: size is controlled only through font-size.
 */
export function Wordmark({
  className,
  variant = "inline",
  tone = "dark",
  caption,
}: {
  className?: string;
  variant?: "inline" | "stacked";
  tone?: "dark" | "light";
  caption?: string;
}) {
  const color = tone === "light" ? "text-ivory" : "text-charcoal";
  if (variant === "stacked") {
    return (
      <div className={cn("flex flex-col items-center text-center", color, className)}>
        <Monogram className="mb-5 h-11 w-11" tone={tone} />
        <span className="font-display text-[2.1em] font-normal leading-none tracking-[0.34em] pl-[0.34em]">CH JEWELS</span>
        {caption && (
          <span className="mt-4 flex items-center gap-3 eyebrow text-[0.62em] opacity-80">
            <span className="h-px w-6 bg-champagne" />
            {caption}
            <span className="h-px w-6 bg-champagne" />
          </span>
        )}
      </div>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-3 leading-none", color, className)} aria-label="CH Jewels">
      <span className="font-display text-[1.55em] font-medium tracking-[0.14em]" aria-hidden>
        CH
      </span>
      <span className="h-[1.1em] w-px bg-champagne/70" aria-hidden />
      <span className="font-sans text-[0.62em] font-medium tracking-[0.52em]" aria-hidden>
        JEWELS
      </span>
    </span>
  );
}

/** Lozenge monogram — echoes a diamond's table seen from above. */
export function Monogram({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const text = tone === "light" ? "#f7f4ee" : "#1d1c1a";
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect x="10" y="10" width="44" height="44" transform="rotate(45 32 32)" fill="none" stroke="#c6a15b" strokeWidth="0.8" />
      <rect x="14.5" y="14.5" width="35" height="35" transform="rotate(45 32 32)" fill="none" stroke="#c6a15b" strokeOpacity="0.45" strokeWidth="0.5" />
      <text
        x="32"
        y="37.5"
        textAnchor="middle"
        fill={text}
        style={{ fontFamily: "var(--font-display)", fontSize: 15, letterSpacing: "0.08em", fontWeight: 500 }}
      >
        CH
      </text>
    </svg>
  );
}
