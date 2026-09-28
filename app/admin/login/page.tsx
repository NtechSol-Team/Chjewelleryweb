import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { AdminLoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Console Sign In" };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const s = await getAdminSession();
  if (s.ok) redirect("/admin/dashboard");
  const { expired } = await searchParams;
  return (
    <main className="grid min-h-dvh bg-a-bg font-ui lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-charcoal p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="font-display text-2xl tracking-[0.14em]">CH</span>
          <span className="h-4 w-px bg-champagne/70" />
          <span className="text-[11px] uppercase tracking-[0.3em] text-white/70">Atelier Console</span>
        </div>
        <div>
          <p className="font-display text-[2.8rem] leading-[1.1] text-white">Manage private clients, catalogues and engagement.</p>
          <p className="mt-4 max-w-md text-[14px] text-white/60">
            Internal use only. All actions are recorded in the activity log.
          </p>
        </div>
        <p className="text-[12px] text-white/40">CH Jewels · Private Clients</p>
      </div>
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="text-[22px] font-semibold tracking-tight">Sign in to the console</h1>
          <p className="mt-1 text-[13px] text-a-muted">Use your CH Jewels staff account.</p>
          {expired && <p className="mt-4 rounded-md bg-warn-soft px-3 py-2 text-[13px] text-warn">Your session has ended. Please sign in again.</p>}
          <AdminLoginForm />
        </div>
      </div>
    </main>
  );
}
