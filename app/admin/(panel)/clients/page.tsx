import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requireAdmin, clientDisplayName } from "@/lib/auth/session";
import { listClientsAdmin } from "@/lib/admin/queries";
import { clientStatus } from "@/lib/admin/status";
import { daysUntil, formatShortDate, relativeTime } from "@/lib/format";
import { PageHeader, ALink, Badge, Th, Td, Initials, EmptyPanel, inputClass } from "@/components/admin/ui";
import { ClientActions } from "@/components/admin/client-actions";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage({ searchParams }: PageProps<"/admin/clients">) {
  await requireAdmin();
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const clients = await listClientsAdmin(query || undefined);

  return (
    <>
      <PageHeader
        title="Clients"
        description={`${clients.length} private clients · ${clients.filter((c) => c.online).length} viewing now`}
        actions={
          <ALink href="/admin/clients/new" variant="primary">
            <Plus className="h-4 w-4" /> Add client
          </ALink>
        }
      />
      <div className="p-5 md:p-8">
        <form className="mb-4 flex max-w-sm items-center gap-2" role="search">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-a-muted" />
            <input name="q" defaultValue={query} placeholder="Search name, company or username" className={`${inputClass} pl-8`} aria-label="Search clients" />
          </div>
        </form>

        {clients.length === 0 ? (
          <div className="rounded-md border border-a-line bg-white">
            <EmptyPanel title="No clients found" body="Try a different search, or add a new private client." action={<ALink href="/admin/clients/new">Add client</ALink>} />
          </div>
        ) : (
          <>
            {/* Desktop / tablet table */}
            <div className="hidden overflow-x-auto rounded-md border border-a-line bg-white md:block">
              <table className="w-full min-w-[1080px] border-collapse">
                <thead>
                  <tr>
                    <Th>Client name</Th>
                    <Th>Company</Th>
                    <Th>Username</Th>
                    <Th>Catalogue</Th>
                    <Th>Last login</Th>
                    <Th>Status</Th>
                    <Th>Session</Th>
                    <Th>Access expiry</Th>
                    <Th className="w-12" />
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => {
                    const st = clientStatus(c);
                    const left = daysUntil(c.accessEndsAt);
                    const name = clientDisplayName(c);
                    return (
                      <tr key={c.id} className="transition-colors hover:bg-a-subtle/50">
                        <Td>
                          <Link href={`/admin/clients/${c.id}`} className="flex items-center gap-3 font-medium hover:underline">
                            <Initials name={name} />
                            {name}
                          </Link>
                        </Td>
                        <Td className="text-a-muted">{c.company ?? "—"}</Td>
                        <Td className="font-mono text-[12px]">{c.username}</Td>
                        <Td>
                          <Link href={`/admin/assignments?client=${c.id}`} className="hover:underline">
                            {c.collectionCount} {c.collectionCount === 1 ? "collection" : "collections"}{c.productCount ? ` + ${c.productCount} pieces` : ""}
                          </Link>
                        </Td>
                        <Td className="text-a-muted">{relativeTime(c.lastLoginAt)}</Td>
                        <Td>
                          <Badge tone={st.tone}>{st.label}</Badge>
                        </Td>
                        <Td>{c.online ? <Badge tone="ok">Online</Badge> : <span className="text-a-muted">Offline</span>}</Td>
                        <Td>
                          <span className={left !== null && left >= 0 && left <= 21 ? "font-medium text-warn" : ""}>{formatShortDate(c.accessEndsAt)}</span>
                          {left !== null && left >= 0 && <span className="ml-1.5 text-[12px] text-a-muted">{left}d</span>}
                        </Td>
                        <Td align="right">
                          <ClientActions id={c.id} name={name} status={c.status} online={c.online} />
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="space-y-3 md:hidden">
              {clients.map((c) => {
                const st = clientStatus(c);
                const name = clientDisplayName(c);
                return (
                  <li key={c.id} className="rounded-md border border-a-line bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/admin/clients/${c.id}`} className="flex min-w-0 items-center gap-3">
                        <Initials name={name} />
                        <span className="min-w-0">
                          <span className="block truncate text-[14px] font-medium">{name}</span>
                          <span className="block truncate text-[12px] text-a-muted">{c.company ?? c.username}</span>
                        </span>
                      </Link>
                      <ClientActions id={c.id} name={name} status={c.status} online={c.online} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone={st.tone}>{st.label}</Badge>
                      {c.online && <Badge tone="ok">Online</Badge>}
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                      <div>
                        <dt className="text-a-muted">Catalogue</dt>
                        <dd>{c.collectionCount} collections{c.productCount ? ` + ${c.productCount}` : ""}</dd>
                      </div>
                      <div>
                        <dt className="text-a-muted">Expires</dt>
                        <dd>{formatShortDate(c.accessEndsAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-a-muted">Last login</dt>
                        <dd>{relativeTime(c.lastLoginAt)}</dd>
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
