import type { Client } from "@/lib/db/schema";

export function clientStatus(c: Pick<Client, "status" | "accessStartsAt" | "accessEndsAt">) {
  const now = Date.now();
  if (c.status === "disabled") return { label: "Disabled", tone: "danger" as const };
  if (c.accessEndsAt && c.accessEndsAt.getTime() < now) return { label: "Expired", tone: "warn" as const };
  if (c.accessStartsAt && c.accessStartsAt.getTime() > now) return { label: "Scheduled", tone: "neutral" as const };
  return { label: "Active", tone: "ok" as const };
}
