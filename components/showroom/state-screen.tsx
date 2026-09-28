import type { ReactNode } from "react";
import { Wordmark } from "@/components/ui/brand";
import { LineLottie } from "@/components/animations/line-lottie";

/** Full-screen state used for access, error and restriction screens. */
export function StateScreen({
  label,
  title,
  body,
  actions,
  icon = "lock",
  footnote,
}: {
  label: string;
  title: string;
  body: ReactNode;
  actions?: ReactNode;
  icon?: "lock" | "diamond";
  footnote?: ReactNode;
}) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center bg-ivory px-6 py-10 text-center">
      <Wordmark className="text-[0.95rem]" />
      <div className="flex w-full max-w-xl flex-1 flex-col items-center justify-center py-16">
        <LineLottie kind={icon} size={88} />
        <p className="mt-10 eyebrow text-gold-deep">{label}</p>
        <h1 className="display mt-5 text-[2.5rem] leading-[1.08] sm:text-[3.4rem]">{title}</h1>
        <div className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-muted">{body}</div>
        {actions && <div className="mt-12 flex flex-col items-center gap-5 sm:flex-row">{actions}</div>}
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="h-px w-10 bg-champagne" />
        <p className="eyebrow text-[0.58rem] text-muted">{footnote ?? "Private & Confidential"}</p>
      </div>
    </main>
  );
}
