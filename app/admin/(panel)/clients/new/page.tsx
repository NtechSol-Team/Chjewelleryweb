import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { requestTime } from "@/lib/format";
import { db, schema } from "@/lib/db";
import { PageHeader, Card, ALink } from "@/components/admin/ui";
import { ClientForm } from "@/components/admin/client-form";

export const metadata: Metadata = { title: "New client" };

export default async function NewClientPage() {
  await requireAdmin();
  const advisors = (await db.select({ name: schema.admins.name }).from(schema.admins)).map((a) => a.name);
  const in90 = new Date(requestTime() + 90 * 86_400_000).toISOString().slice(0, 10);
  return (
    <>
      <PageHeader eyebrow="Clients" title="Add a private client" description="Create credentials, then choose which collections and pieces they may see." actions={<ALink href="/admin/clients">Cancel</ALink>} />
      <div className="max-w-3xl p-5 md:p-8">
        <Card>
          <ClientForm clientId={null} advisors={advisors} initial={{ accessEndsAt: in90, accessStartsAt: new Date(requestTime()).toISOString().slice(0, 10) }} />
        </Card>
      </div>
    </>
  );
}
