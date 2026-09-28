import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getClientSession } from "@/lib/auth/session";
import { EDITORIAL } from "@/lib/media";
import { LoginExperience } from "@/components/showroom/login-experience";

export const metadata: Metadata = { title: "Private Access" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const session = await getClientSession();
  if (session.ok) redirect("/catalogue");
  const sp = await searchParams;
  return <LoginExperience image={EDITORIAL.login} signedOut={sp["signed-out"] === "1"} />;
}
