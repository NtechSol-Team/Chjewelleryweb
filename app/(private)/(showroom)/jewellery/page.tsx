import type { Metadata } from "next";
import { CatalogueListing } from "@/components/catalogue/catalogue-listing";

export const metadata: Metadata = { title: "Jewellery" };

export default async function JewelleryPage({ searchParams }: PageProps<"/jewellery">) {
  return (
    <CatalogueListing
      searchParams={await searchParams}
      label="The Private Catalogue"
      title="Jewellery"
      intro={(n, name) => `${n} pieces, selected for ${name}.`}
    />
  );
}
