import { redirect } from "next/navigation";
import { getClientSession } from "@/lib/auth/session";

export default async function Root() {
  const session = await getClientSession();
  redirect(session.ok ? "/catalogue" : "/login");
}
