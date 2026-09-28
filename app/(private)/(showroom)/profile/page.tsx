import type { Metadata } from "next";
import { Eye, Lock, MonitorSmartphone, ShieldCheck, Timer } from "lucide-react";
import { requireClient, clientDisplayName } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings";
import { listClientCollections, listPieces } from "@/lib/catalogue";
import { daysUntil, formatDate, formatDateTime } from "@/lib/format";
import { clientLogout } from "@/lib/actions/client-auth";
import { RevealText, FadeUp } from "@/components/animations/reveal";
import { Spec } from "@/components/ui/editorial";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Your Access" };

export default async function ProfilePage() {
  const { client, session } = await requireClient();
  const [settings, collections, pieces] = await Promise.all([getSettings(), listClientCollections(client.id), listPieces(client.id)]);
  const remaining = daysUntil(client.accessEndsAt);

  return (
    <>
      <section className="px-gutter pb-12 pt-[calc(var(--header-h)+3.5rem)] md:pb-20 md:pt-[calc(var(--header-h)+6rem)]">
        <p className="eyebrow text-gold-deep">Your Private Access</p>
        <RevealText as="h1" on="mount" text={clientDisplayName(client)} className="display mt-5 text-[3rem] sm:text-[4.2rem] lg:text-[5.6rem]" />
        {client.company && <p className="mt-4 font-display text-xl italic text-muted">{client.company}{client.city ? `, ${client.city}` : ""}</p>}
      </section>

      <section className="grid gap-px border-y border-line bg-line md:grid-cols-2 xl:grid-cols-3">
        <Panel n="01" title="Access">
          <dl>
            <Spec label="Status" value={<span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-ok" /> Active</span>} />
            <Spec label="Valid until" value={client.accessEndsAt ? `${formatDate(client.accessEndsAt)}${remaining !== null ? ` · ${remaining} days` : ""}` : "Open-ended"} />
            <Spec label="Collections" value={`${collections.length} opened for you`} />
            <Spec label="Pieces" value={`${pieces.length} in your catalogue`} />
            <Spec label="Username" value={client.username} />
          </dl>
        </Panel>

        <Panel n="02" title="Current Session">
          <dl>
            <Spec label="Session" value={<span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-champagne" /> Active · {session.id.slice(0, 8).toUpperCase()}</span>} />
            <Spec label="Signed in" value={formatDateTime(session.createdAt)} />
            <Spec label="Device" value={session.userAgent ?? "—"} />
            <Spec label="Idle timeout" value={`${settings.session.idleMinutes} minutes`} />
            <Spec label="Expires" value={formatDateTime(session.expiresAt)} />
          </dl>
        </Panel>

        <Panel n="03" title="Your Advisor">
          <p className="font-display text-[2rem] leading-tight">{client.advisor ?? "CH Jewels Private Clients"}</p>
          <p className="mt-2 caption text-muted">{settings.concierge.hours}</p>
          <div className="mt-8 space-y-2 text-[0.92rem]">
            <a className="block hover:text-gold-deep" href={`tel:${settings.concierge.phone.replace(/\s/g, "")}`}>
              {settings.concierge.phone}
            </a>
            <a className="block hover:text-gold-deep" href={`mailto:${settings.concierge.email}`}>
              {settings.concierge.email}
            </a>
          </div>
        </Panel>
      </section>

      <section className="px-gutter py-24">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow text-[0.6rem] text-muted">Privacy &amp; Security</p>
          <h2 className="display mt-4 text-[2.4rem] sm:text-[3rem]">How your showroom is protected</h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-2">
            {[
              { icon: Lock, t: "Individual access", d: "Your credentials open only the pieces selected for you. Nothing here is public." },
              { icon: MonitorSmartphone, t: "One active session", d: "Signing in on a new device closes any earlier session automatically." },
              { icon: Timer, t: "Automatic timeout", d: `After ${settings.session.idleMinutes} minutes of inactivity the showroom closes for your privacy.` },
              {
                icon: Eye,
                t: "Personal watermark",
                d: "Imagery carries a faint watermark linked to your session. As with any website, on-screen content cannot be fully protected from capture — we kindly ask that pieces remain confidential.",
              },
            ].map(({ icon: Icon, t, d }, i) => (
              <FadeUp key={t} delay={i * 0.06} className="flex gap-5">
                <Icon className="mt-1 h-5 w-5 shrink-0 text-gold-deep" strokeWidth={1.1} />
                <div>
                  <p className="eyebrow text-[0.62rem] text-charcoal">{t}</p>
                  <p className="mt-3 text-[0.9rem] leading-relaxed text-muted">{d}</p>
                </div>
              </FadeUp>
            ))}
          </div>
          <form action={clientLogout} className="mt-16 flex flex-col items-start gap-4 border-t border-line pt-10 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-3 text-[0.85rem] text-muted">
              <ShieldCheck className="h-4 w-4 text-gold-deep" strokeWidth={1.2} /> Signing out ends this session on all tabs.
            </p>
            <Button variant="outline">Sign Out Securely</Button>
          </form>
        </div>
      </section>
    </>
  );
}

function Panel({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-ivory px-gutter py-12 md:px-10 xl:px-12">
      <p className="flex items-center gap-4">
        <span className="numeral text-sm text-gold-deep">{n}</span>
        <span className="h-px w-8 bg-line" />
        <span className="eyebrow text-[0.62rem] text-charcoal">{title}</span>
      </p>
      <div className="mt-8">{children}</div>
    </div>
  );
}
