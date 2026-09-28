import "server-only";
import { cache } from "react";
import { db, schema } from "@/lib/db";

export type AppSettings = {
  watermark: { enabled: boolean; opacity: number };
  privacyBlur: { enabled: boolean };
  session: { idleMinutes: number; maxHours: number; singleSession: boolean };
  concierge: { phone: string; email: string; hours: string };
};

const DEFAULTS: AppSettings = {
  watermark: { enabled: true, opacity: 0.08 },
  privacyBlur: { enabled: true },
  session: {
    idleMinutes: Number(process.env.SESSION_IDLE_MINUTES ?? 30),
    maxHours: Number(process.env.SESSION_MAX_HOURS ?? 12),
    singleSession: true,
  },
  concierge: { phone: "+91 22 6600 1080", email: "private@chjewels.com", hours: "Mon–Sat, 10:00–19:00 IST" },
};

export const getSettings = cache(async (): Promise<AppSettings> => {
  const rows = await db.select().from(schema.settings);
  const merged = structuredClone(DEFAULTS) as Record<string, unknown>;
  for (const r of rows) merged[r.key] = { ...(merged[r.key] as object), ...(r.value as object) };
  return merged as AppSettings;
});
