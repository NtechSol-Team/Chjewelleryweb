const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });
const shortDate = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true });

export const formatDate = (d: Date | string | null | undefined) => (d ? dateFmt.format(new Date(d)) : "—");
export const formatShortDate = (d: Date | string | null | undefined) => (d ? shortDate.format(new Date(d)) : "—");
export const formatTime = (d: Date | string) => timeFmt.format(new Date(d)).toUpperCase();
export const formatDateTime = (d: Date | string | null | undefined) =>
  d ? `${shortDate.format(new Date(d))}, ${timeFmt.format(new Date(d)).toUpperCase()}` : "—";

/** 198000 → "03m 18s" */
export function formatDuration(ms: number) {
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

export function relativeTime(d: Date | string | null | undefined) {
  if (!d) return "Never";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} d ago`;
  return formatShortDate(d);
}

export function daysUntil(d: Date | string | null | undefined) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

/** Request-time clock for server components (rendered once per request). */
export const requestTime = () => Date.now();
