import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/session";

const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");

const IMAGE = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const VIDEO = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

/**
 * Uploads product media into private storage (never /public). Files are
 * served only through /api/media, which checks the viewer's entitlement.
 *
 * form fields: productId, kind = image | video | spin, files[] (spin = ordered frames)
 */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session.ok) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const form = await req.formData();
  const productId = String(form.get("productId") ?? "");
  const kind = String(form.get("kind") ?? "image") as "image" | "video" | "spin";
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!productId || !files.length) return NextResponse.json({ error: "No files received" }, { status: 400 });

  const [product] = await db.select({ id: schema.products.id }).from(schema.products).where(eq(schema.products.id, productId)).limit(1);
  if (!product) return NextResponse.json({ error: "Unknown product" }, { status: 404 });

  const allowed = kind === "video" ? VIDEO : IMAGE;
  for (const f of files) {
    if (!allowed.has(f.type)) return NextResponse.json({ error: `Unsupported file type: ${f.name}` }, { status: 415 });
    if (f.size > (kind === "video" ? 120 : 15) * 1024 * 1024) return NextResponse.json({ error: `File too large: ${f.name}` }, { status: 413 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const saved: string[] = [];
  for (const f of files) {
    const name = `${randomUUID()}.${EXT[f.type]}`;
    await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await f.arrayBuffer()));
    saved.push(`/api/media/${name}`);
  }

  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${schema.productMedia.sortOrder}), -1)`.mapWith(Number) })
    .from(schema.productMedia)
    .where(eq(schema.productMedia.productId, productId));

  if (kind === "spin") {
    await db.insert(schema.productMedia).values({ productId, kind: "spin", url: saved[0], frames: saved, alt: "360° view", sortOrder: max + 1 });
  } else {
    await db.insert(schema.productMedia).values(saved.map((url, i) => ({ productId, kind, url, sortOrder: max + 1 + i })));
  }
  return NextResponse.json({ ok: true, count: saved.length });
}
