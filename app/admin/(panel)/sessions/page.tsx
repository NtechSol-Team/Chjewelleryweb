import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { sessionsAdmin } from "@/lib/admin/queries";
import { getSettings } from "@/lib/settings";
import { formatDateTime, relativeTime, requestTime } from "@/lib/format";
import { PageHeader, Card, Badge, Th, Td } from "@/components/admin/ui";
import { RevokeButton } from "@/components/admin/revoke-button";

export const metadata: Metadata = { title: "Sessions" };

const REASONS: Record<string, string> = { logout: "Signed out", superseded: "Signed in elsewhere", admin: "Ended by staff", disabled: "Account disabled", timeout: "Timed out" };

export default async function SessionsPage() {
  const { session: me } = await requireAdmin();
  const [{ active, ended }, settings] = await Promise.all([sessionsAdmin(), getSettings()]);
  const idleMs = settings.session.idleMinutes * 60_000;

  return (
    <>
      <PageHeader
        title="Sessions"
        description={`Single active session per client · ${settings.session.idleMinutes}-minute idle timeout · ${settings.session.maxHours}-hour maximum`}
      />
      <div className="space-y-5 p-5 md:p-8">
        <Card title="Active now" description={`${active.length} live ${active.length === 1 ? "session" : "sessions"}`} bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr>
                  <Th>Who</Th>
                  <Th>Device</Th>
                  <Th>IP</Th>
                  <Th>Signed in</Th>
                  <Th>Last activity</Th>
                  <Th>Idle timeout in</Th>
                  <Th className="w-20" />
                </tr>
              </thead>
              <tbody>
                {active.map(({ s, clientName, adminName }) => {
                  const left = Math.max(0, Math.round((idleMs - (requestTime() - s.lastSeenAt.getTime())) / 60000));
                  const who = s.subjectType === "client" ? clientName ?? "Client" : adminName ?? "Staff";
                  return (
                    <tr key={s.id}>
                      <Td>
                        <span className="flex items-center gap-2">
                          {s.subjectType === "client" ? <Link href={`/admin/clients/${s.subjectId}`} className="font-medium hover:underline">{who}</Link> : <span className="font-medium">{who}</span>}
                          <Badge tone={s.subjectType === "client" ? "ok" : "neutral"}>{s.subjectType === "client" ? "Client" : "Staff"}</Badge>
                        </span>
                      </Td>
                      <Td>{s.userAgent ?? "—"}</Td>
                      <Td className="font-mono text-[12px] text-a-muted">{s.ip}</Td>
                      <Td className="text-a-muted">{formatDateTime(s.createdAt)}</Td>
                      <Td>{relativeTime(s.lastSeenAt)}</Td>
                      <Td><span className={left <= 5 ? "text-warn" : ""}>{left} min</span></Td>
                      <Td align="right">{s.id === me.id ? <span className="text-[12px] text-a-muted">You</span> : <RevokeButton sessionId={s.id} who={who} />}</Td>
                    </tr>
                  );
                })}
                {active.length === 0 && (
                  <tr><Td className="py-8 text-center text-a-muted">No one is signed in right now.</Td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Recently ended" bodyClassName="p-0">
          <ul className="divide-y divide-a-line">
            {ended.map(({ s, clientName, adminName }) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-[13px]">
                <span>
                  <span className="font-medium">{s.subjectType === "client" ? clientName : adminName}</span>
                  <span className="text-a-muted"> · {s.userAgent}</span>
                </span>
                <span className="flex items-center gap-3 text-[12px] text-a-muted">
                  {formatDateTime(s.createdAt)}
                  <Badge tone={s.revokedReason === "admin" || s.revokedReason === "disabled" ? "danger" : s.revokedReason === "superseded" ? "warn" : "neutral"}>
                    {s.revokedReason ? REASONS[s.revokedReason] : "Expired"}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
