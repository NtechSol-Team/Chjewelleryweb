import { requireClient } from "@/lib/auth/session";
import { listPieces } from "@/lib/catalogue";
import { buildFacets, parseFilters } from "@/lib/catalogue-filters";
import { logActivity } from "@/lib/activity";
import { CatalogueBrowser } from "./catalogue-browser";
import { RevealText } from "@/components/animations/reveal";
import { EmptyState } from "@/components/ui/editorial";

type SP = Record<string, string | string[] | undefined>;

export async function CatalogueListing({
  searchParams,
  label,
  title,
  intro,
  onlyNew,
}: {
  searchParams: SP;
  label: string;
  title: string;
  intro: (count: number, name: string) => string;
  onlyNew?: boolean;
}) {
  const { client } = await requireClient();
  const active = parseFilters(searchParams);
  const [all, pieces] = await Promise.all([
    listPieces(client.id, { onlyNew }),
    listPieces(client.id, { ...active, onlyNew }),
  ]);
  if (active.q) await logActivity({ actorType: "client", actorId: client.id, clientId: client.id, type: "search", detail: active.q });

  const name = [client.salutation, client.lastName].filter(Boolean).join(" ");

  return (
    <>
      <section className="px-gutter pb-12 pt-[calc(var(--header-h)+3.5rem)] md:pb-16 md:pt-[calc(var(--header-h)+6rem)]">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="eyebrow text-gold-deep">{label}</p>
            <RevealText as="h1" on="mount" text={title} className="display mt-5 text-[3.4rem] sm:text-[4.6rem] lg:text-[6.5rem]" />
          </div>
          <p className="max-w-xs font-display text-xl italic leading-snug text-muted md:text-right">{intro(all.length, name)}</p>
        </div>
      </section>
      {all.length === 0 ? (
        <EmptyState
          className="px-gutter"
          title={onlyNew ? "No new arrivals yet" : "No collection available"}
          body={onlyNew ? "New pieces selected for you will appear here first." : "Your private catalogue is currently being prepared."}
        />
      ) : (
        <CatalogueBrowser pieces={pieces} facets={buildFacets(all, { withCollections: true })} active={active} />
      )}
    </>
  );
}
