import { NextResponse } from "next/server";
import { validateClientSession } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings";

/** Heartbeat: lets an open tab learn promptly about revocation, timeout or disablement. */
export async function POST(req: Request) {
  const { active } = (await req.json().catch(() => ({}))) as { active?: boolean };
  const res = await validateClientSession(!!active);
  if (!res.ok) return NextResponse.json({ ok: false, reason: res.reason }, { status: 401 });
  const { session } = await getSettings();
  const idleMsLeft = session.idleMinutes * 60_000 - (Date.now() - res.session.lastSeenAt.getTime());
  return NextResponse.json({ ok: true, idleMsLeft: active ? session.idleMinutes * 60_000 : idleMsLeft });
}
