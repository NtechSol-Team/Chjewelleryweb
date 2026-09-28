import type { Metadata } from "next";
import { requireClient, clientDisplayName } from "@/lib/auth/session";
import { listClientCollections, listPieces } from "@/lib/catalogue";
import { EDITORIAL } from "@/lib/media";
import { WelcomeExperience } from "@/components/showroom/welcome-experience";

export const metadata: Metadata = { title: "Welcome" };

export default async function WelcomePage() {
  const { client } = await requireClient();
  const [collections, pieces] = await Promise.all([listClientCollections(client.id), listPieces(client.id)]);
  return (
    <WelcomeExperience
      name={clientDisplayName(client)}
      image={EDITORIAL.welcome}
      collections={collections.length}
      pieces={pieces.length}
      advisor={client.advisor}
    />
  );
}
