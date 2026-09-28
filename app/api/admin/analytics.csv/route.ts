import { getAdminSession } from "@/lib/auth/session";
import { viewingTable } from "@/lib/admin/queries";

/** CSV export of the analytics table with the same filters. */
export async function GET(req: Request) {
  const s = await getAdminSession();
  if (!s.ok) return new Response("Unauthorised", { status: 401 });
  const sp = new URL(req.url).searchParams;
  const rows = await viewingTable({
    clientId: sp.get("client") || undefined,
    collection: sp.get("collection") || undefined,
    productQ: sp.get("product") || undefined,
    sinceDays: Number(sp.get("days")) || 30,
  });
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    ["Client", "Product code", "Product", "Collection", "Views", "View time (s)", "Last viewed", "Shortlisted", "Discussed"].map(esc).join(","),
    ...rows.map((r) => [r.clientName, r.code, r.name, r.collection, r.views, Math.round(r.ms / 1000), r.lastViewed.toISOString(), r.shortlisted, r.discussed].map(esc).join(",")),
  ];
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ch-jewels-engagement-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
