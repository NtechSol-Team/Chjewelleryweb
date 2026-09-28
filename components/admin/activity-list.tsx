import Link from "next/link";
import {
  Ban,
  Eye,
  Heart,
  HeartOff,
  KeyRound,
  Layers,
  LogIn,
  LogOut,
  MessageSquare,
  Pencil,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Link2,
  Power,
} from "lucide-react";
import type { ActivityRow } from "@/lib/admin/queries";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";

const META: Record<string, { icon: typeof Eye; verb: string; tone?: "gold" | "danger" | "ok" }> = {
  login: { icon: LogIn, verb: "logged in" },
  logout: { icon: LogOut, verb: "logged out" },
  login_failed: { icon: ShieldAlert, verb: "failed a sign-in attempt", tone: "danger" },
  view_product: { icon: Eye, verb: "viewed" },
  view_collection: { icon: Layers, verb: "opened collection" },
  search: { icon: Search, verb: "searched for" },
  shortlist_add: { icon: Heart, verb: "shortlisted", tone: "gold" },
  shortlist_remove: { icon: HeartOff, verb: "removed from shortlist" },
  consultation_request: { icon: MessageSquare, verb: "requested a consultation", tone: "gold" },
  session_revoked: { icon: Power, verb: "session was ended", tone: "danger" },
  account_disabled: { icon: Ban, verb: "account was disabled", tone: "danger" },
  account_enabled: { icon: ShieldCheck, verb: "account was re-enabled", tone: "ok" },
  password_reset: { icon: KeyRound, verb: "password was reset" },
  catalogue_updated: { icon: Link2, verb: "catalogue was updated" },
  client_created: { icon: UserPlus, verb: "was added as a client", tone: "ok" },
  client_updated: { icon: Pencil, verb: "profile was updated" },
  product_updated: { icon: Pencil, verb: "Product updated" },
  product_created: { icon: Pencil, verb: "Product created" },
};

export function describe(a: ActivityRow) {
  const m = META[a.type] ?? { icon: Eye, verb: a.type };
  const who = a.clientName ?? "Staff";
  const object =
    a.type === "view_product" || a.type === "shortlist_add" || a.type === "shortlist_remove"
      ? a.productCode ?? a.detail
      : a.type === "search" || a.type === "view_collection"
        ? `“${a.detail}”`
        : null;
  const trailing = ["consultation_request", "catalogue_updated", "login", "session_revoked", "account_disabled"].includes(a.type) ? a.detail : null;
  return { ...m, who, object, trailing };
}

/** Audit-style vertical timeline. */
export function ActivityTimeline({ rows, compact }: { rows: ActivityRow[]; compact?: boolean }) {
  return (
    <ol className="relative">
      {rows.map((a, i) => {
        const d = describe(a);
        const Icon = d.icon;
        return (
          <li key={a.id} className="relative grid grid-cols-[4.5rem_1.75rem_1fr] gap-3 pb-5 last:pb-0">
            <time className="pt-1 text-right text-[12px] tabular text-a-muted" dateTime={new Date(a.createdAt).toISOString()}>
              {formatTime(a.createdAt)}
            </time>
            <div className="relative flex justify-center">
              {i < rows.length - 1 && <span className="absolute top-7 bottom-[-1.25rem] w-px bg-a-line" aria-hidden />}
              <span
                className={cn(
                  "relative z-[1] grid h-7 w-7 place-items-center rounded-full border bg-white",
                  d.tone === "gold" ? "border-champagne/60 text-gold-deep" : d.tone === "danger" ? "border-danger/30 text-danger" : d.tone === "ok" ? "border-ok/30 text-ok" : "border-a-line text-a-muted",
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
              </span>
            </div>
            <div className="min-w-0 pt-1 text-[13px] leading-snug">
              {a.clientId ? (
                <Link href={`/admin/clients/${a.clientId}`} className="font-medium hover:underline">
                  {d.who}
                </Link>
              ) : (
                <span className="font-medium">{d.who}</span>
              )}{" "}
              <span className="text-a-muted">{d.verb}</span>{" "}
              {d.object && <span className="font-medium">{d.object}</span>}
              {!compact && a.productName && a.type === "view_product" && <span className="text-a-muted"> · {a.productName}</span>}
              {d.trailing && <p className="mt-0.5 truncate text-[12px] text-a-muted">{d.trailing}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
