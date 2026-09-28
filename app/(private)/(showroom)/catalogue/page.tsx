import type { Metadata } from "next";
import { requireClient } from "@/lib/auth/session";
import { listClientCollections, listPieces, shortlistIds } from "@/lib/catalogue";
import { EDITORIAL, FILMS } from "@/lib/media";
import { Hero } from "@/components/catalogue/home/hero";
import { Intro } from "@/components/catalogue/home/intro";
import { FeaturedCollections } from "@/components/catalogue/home/featured-collections";
import { SignatureRail } from "@/components/catalogue/home/signature-rail";
import { FilmBand } from "@/components/catalogue/home/film-band";
import { NewArrivals } from "@/components/catalogue/home/new-arrivals";
import { Craftsmanship } from "@/components/catalogue/home/craftsmanship";
import { Consultation } from "@/components/catalogue/home/consultation";
import { EmptyState } from "@/components/ui/editorial";

export const metadata: Metadata = { title: "Private Collection" };

export default async function CatalogueHome() {
  const { client } = await requireClient();
  const [collections, pieces, saved] = await Promise.all([
    listClientCollections(client.id),
    listPieces(client.id),
    shortlistIds(client.id),
  ]);
  const name = [client.salutation, client.lastName].filter(Boolean).join(" ");

  if (pieces.length === 0) {
    return (
      <>
        <Hero image={EDITORIAL.hero} pieceCount={0} name={name} />
        <EmptyState className="px-gutter" title="No collection available" body="Your private catalogue is currently being prepared." />
      </>
    );
  }

  const signature = [...pieces].sort((a, b) => Number(b.hasSpin || b.hasVideo) - Number(a.hasSpin || a.hasVideo)).slice(0, 8);
  const newest = pieces.filter((p) => p.isNew).slice(0, 4);

  return (
    <>
      <Hero image={EDITORIAL.hero} pieceCount={pieces.length} name={name} />
      <Intro advisor={client.advisor} name={name} collections={collections.length} pieces={pieces.length} />
      <FeaturedCollections collections={collections} />
      <SignatureRail pieces={signature} />
      <FilmBand film={FILMS.sparkle} />
      {newest.length > 0 && <NewArrivals pieces={newest} />}
      <Craftsmanship images={[EDITORIAL.craft, EDITORIAL.craftDetail]} />
      <Consultation image={EDITORIAL.consultation} saved={saved.length} advisor={client.advisor} />
    </>
  );
}
