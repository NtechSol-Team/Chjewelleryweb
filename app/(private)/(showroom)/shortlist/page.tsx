import type { Metadata } from "next";
import { requireClient } from "@/lib/auth/session";
import { listShortlist } from "@/lib/catalogue";
import { formatDate } from "@/lib/format";
import { RevealText } from "@/components/animations/reveal";
import { ShortlistView } from "@/components/catalogue/shortlist-view";

export const metadata: Metadata = { title: "My Shortlist" };

export default async function ShortlistPage() {
  const { client } = await requireClient();
  const items = await listShortlist(client.id);

  return (
    <>
      <section className="px-gutter pb-12 pt-[calc(var(--header-h)+3.5rem)] md:pb-16 md:pt-[calc(var(--header-h)+6rem)]">
        <p className="eyebrow text-gold-deep">For Private Consultation</p>
        <RevealText as="h1" on="mount" text="My Shortlist" className="display mt-5 text-[3.4rem] sm:text-[4.6rem] lg:text-[6.5rem]" />
        <p className="mt-6 max-w-lg font-display text-xl italic leading-snug text-muted">
          Pieces you have set aside. Select those you would like to discuss, and {client.advisor ?? "your advisor"} will arrange a private viewing.
        </p>
      </section>
      <ShortlistView
        // Dates are formatted on the server so client/server timezones never disagree.
        items={items.map((i) => ({ piece: i.piece, added: formatDate(i.addedAt) }))}
        advisor={client.advisor}
      />
    </>
  );
}
