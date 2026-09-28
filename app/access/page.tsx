import type { Metadata } from "next";
import type { AccessReason } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings";
import { StateScreen } from "@/components/showroom/state-screen";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Private Access" };

const COPY: Record<AccessReason, { label: string; title: string; body: string; primary: "login" | "contact" }> = {
  required: {
    label: "Private Access Required",
    title: "An invitation-only showroom.",
    body: "This showroom is available exclusively to selected CH Jewels clients. Please sign in with the credentials provided by your advisor.",
    primary: "login",
  },
  "session-expired": {
    label: "Session Expired",
    title: "Your viewing session has closed.",
    body: "For your privacy, sessions close automatically after a period of inactivity. Please sign in again to continue.",
    primary: "login",
  },
  "signed-in-elsewhere": {
    label: "Session Ended",
    title: "Opened on another device.",
    body: "Your private access was just opened elsewhere. For security, only one active session is permitted at a time.",
    primary: "login",
  },
  "ended-by-advisor": {
    label: "Session Closed",
    title: "Your session was closed by CH Jewels.",
    body: "Your advisor has ended this viewing session. You are welcome to sign in again, or contact us if you need assistance.",
    primary: "login",
  },
  disabled: {
    label: "Access Paused",
    title: "Your private access is paused.",
    body: "Your CH Jewels showroom is not currently available. Your advisor will be pleased to assist you.",
    primary: "contact",
  },
  "access-expired": {
    label: "Private Access Expired",
    title: "Your catalogue access is no longer active.",
    body: "Private viewing windows are prepared for a set period. Please contact CH Jewels to arrange a new presentation.",
    primary: "contact",
  },
  "access-pending": {
    label: "Preparing Your Showroom",
    title: "Your collection is being prepared.",
    body: "Your private access has been created and will open on the date agreed with your advisor.",
    primary: "contact",
  },
};

export default async function AccessPage({ searchParams }: PageProps<"/access">) {
  const { reason } = await searchParams;
  const copy = COPY[(reason as AccessReason) ?? "required"] ?? COPY.required;
  const { concierge } = await getSettings();
  const contact = (
    <ButtonLink href={`mailto:${concierge.email}`} variant={copy.primary === "contact" ? "primary" : "outline"}>
      Contact CH Jewels
    </ButtonLink>
  );
  const login = (
    <ButtonLink href="/login" variant={copy.primary === "login" ? "primary" : "outline"}>
      Return to Login
    </ButtonLink>
  );
  return (
    <StateScreen
      label={copy.label}
      title={copy.title}
      body={<p>{copy.body}</p>}
      actions={copy.primary === "login" ? <>{login}{contact}</> : <>{contact}{login}</>}
      footnote={`${concierge.phone} · ${concierge.hours}`}
    />
  );
}
