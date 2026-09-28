import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { PageHeader, Card, ALink } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin();
  const collections = await db.select({ id: schema.collections.id, name: schema.collections.name }).from(schema.collections).orderBy(asc(schema.collections.sortOrder));
  return (
    <>
      <PageHeader eyebrow="Products" title="New product" description="Create the piece first; images, film and 360° media are added on the next step." actions={<ALink href="/admin/products">Cancel</ALink>} />
      <div className="max-w-4xl p-5 md:p-8">
        <Card>
          <ProductForm productId={null} collections={collections} />
        </Card>
      </div>
    </>
  );
}
