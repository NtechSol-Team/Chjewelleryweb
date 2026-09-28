import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { collectionsAdmin } from "@/lib/admin/queries";
import { PageHeader } from "@/components/admin/ui";
import { CollectionsManager } from "@/components/admin/collections-manager";

export const metadata: Metadata = { title: "Collections" };

export default async function CollectionsAdminPage() {
  await requireAdmin();
  const rows = await collectionsAdmin();
  return (
    <>
      <PageHeader title="Collections" description="Order sets how collections appear in every client's showroom. Hidden collections disappear from all catalogues immediately." />
      <div className="max-w-5xl p-5 md:p-8">
        <CollectionsManager rows={rows} />
      </div>
    </>
  );
}
