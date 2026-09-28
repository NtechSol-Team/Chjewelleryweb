import { requireClient, clientDisplayName } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings";
import { shortlistIds } from "@/lib/catalogue";
import { ShowroomProvider } from "@/components/showroom/showroom-context";
import { SessionGuard } from "@/components/showroom/session-guard";
import { PrivacyShield } from "@/components/showroom/privacy-shield";
import { NetworkNotice } from "@/components/showroom/network-notice";
import { IntroLoader } from "@/components/showroom/intro-loader";

/**
 * Everything under (private) is authorised against Postgres on every render:
 * revoked, idle, disabled or out-of-window sessions never reach a page.
 */
export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const { client, session } = await requireClient();
  const [settings, saved] = await Promise.all([getSettings(), shortlistIds(client.id)]);

  return (
    <ShowroomProvider
      client={{
        displayName: clientDisplayName(client),
        shortName: [client.salutation, client.lastName].filter(Boolean).join(" "),
        firstName: client.firstName,
        sessionRef: session.id.slice(0, 8).toUpperCase(),
        sessionStarted: session.createdAt.toISOString(),
      }}
      watermark={settings.watermark}
      initialShortlist={saved}
    >
      <div className="grain">{children}</div>
      <IntroLoader />
      <SessionGuard idleMinutes={settings.session.idleMinutes} />
      <PrivacyShield enabled={settings.privacyBlur.enabled} />
      <NetworkNotice />
    </ShowroomProvider>
  );
}
