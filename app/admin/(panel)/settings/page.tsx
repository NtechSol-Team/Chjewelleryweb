import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getSettings();
  return (
    <>
      <PageHeader title="Settings" description="Showroom-wide privacy, session and concierge settings." />
      <div className="p-5 md:p-8">
        <SettingsForm initial={settings} />
      </div>
    </>
  );
}
