import type { Metadata } from "next";
import { CatalogueListing } from "@/components/catalogue/catalogue-listing";

export const metadata: Metadata = { title: "New Arrivals" };

export default async function NewArrivalsPage({ searchParams }: PageProps<"/new-arrivals">) {
  return (
    <CatalogueListing
      onlyNew
      searchParams={await searchParams}
      label="Recently Added"
      title="New Arrivals"
      intro={(n) => `${n} ${n === 1 ? "piece" : "pieces"} newly added to your showroom.`}
    />
  );
}
