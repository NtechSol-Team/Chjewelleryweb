import type { Metadata } from "next";
import { asc, eq, sql } from "drizzle-orm";
import { requireAdmin, clientDisplayName } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { PageHeader, EmptyPanel, ALink } from "@/components/admin/ui";
import { AssignmentEditor } from "@/components/admin/assignment-editor";

export const metadata: Metadata = { title: "Catalogue Assignment" };

export default async function AssignmentsPage({ searchParams }: PageProps<"/admin/assignments">) {
  await requireAdmin();
  const sp = await searchParams;
  const clients = await db.select().from(schema.clients).orderBy(asc(schema.clients.lastName));
  if (!clients.length)
    return (
      <>
        <PageHeader title="Catalogue Assignment" />
        <EmptyPanel title="No clients yet" body="Add a client to begin curating their private catalogue." action={<ALink href="/admin/clients/new">Add client</ALink>} />
      </>
    );

  const selectedId = typeof sp.client === "string" && clients.some((c) => c.id === sp.client) ? sp.client : clients[0].id;

  const [collections, products, assignedCols, assignedProds] = await Promise.all([
    db.select().from(schema.collections).orderBy(asc(schema.collections.sortOrder)),
    db
      .select({
        id: schema.products.id,
        code: schema.products.code,
        name: schema.products.name,
        category: schema.products.category,
        collectionId: schema.products.collectionId,
        status: schema.products.status,
        cover: sql<string | null>`(select m.url from product_media m where m.product_id = "products"."id" and m.kind = 'image' order by m.sort_order limit 1)`,
      })
      .from(schema.products)
      .orderBy(asc(schema.products.code)),
    db.select({ id: schema.clientCollections.collectionId }).from(schema.clientCollections).where(eq(schema.clientCollections.clientId, selectedId)),
    db.select({ id: schema.clientProducts.productId }).from(schema.clientProducts).where(eq(schema.clientProducts.clientId, selectedId)),
  ]);

  return (
    <>
      <PageHeader
        title="Catalogue Assignment"
        description="Choose exactly what each client may see: whole collections, individual pieces, or both."
      />
      <AssignmentEditor
        key={selectedId}
        isNew={sp.new === "1"}
        clients={clients.map((c) => ({ id: c.id, name: clientDisplayName(c), company: c.company, status: c.status }))}
        clientId={selectedId}
        collections={collections.map((c) => ({ id: c.id, name: c.name, cover: c.coverUrl, published: c.isPublished }))}
        products={products.filter((p) => p.status !== "archived")}
        initialCollections={assignedCols.map((r) => r.id)}
        initialProducts={assignedProds.map((r) => r.id)}
      />
    </>
  );
}
