import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { eq, or, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getAdminSession, validateClientSession } from "@/lib/auth/session";
import { canAccessProduct } from "@/lib/catalogue";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

/**
 * Serves privately uploaded media. Admins may see everything; a client only
 * receives a file that belongs to a piece in their own catalogue.
 */
export async function GET(req: Request, ctx: RouteContext<"/api/media/[file]">) {
  const { file } = await ctx.params;
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|avif|mp4|webm|mov)$/.test(file)) return new NextResponse(null, { status: 404 });

  const admin = await getAdminSession();
  if (!admin.ok) {
    const client = await validateClientSession(false);
    if (!client.ok) return new NextResponse(null, { status: 401 });
    const url = `/api/media/${file}`;
    const [m] = await db
      .select({ productId: schema.productMedia.productId })
      .from(schema.productMedia)
      .where(or(eq(schema.productMedia.url, url), sql`${schema.productMedia.frames} ? ${url}`))
      .limit(1);
    if (!m || !(await canAccessProduct(client.subject.id, m.productId))) return new NextResponse(null, { status: 404 });
  }

  const full = path.join(process.cwd(), "storage", "uploads", file);
  try {
    const info = await stat(full);
    const ext = file.split(".").pop()!;
    const type = TYPES[ext];
    const range = req.headers.get("range");
    const buf = await readFile(full);
    const headers = {
      "Content-Type": type,
      "Cache-Control": "private, max-age=3600",
      "Accept-Ranges": "bytes",
      "X-Robots-Tag": "noindex",
    };
    // Byte ranges so video can seek.
    if (range && type.startsWith("video/")) {
      const [s, e] = range.replace("bytes=", "").split("-");
      const start = Number(s);
      const end = e ? Number(e) : Math.min(start + 2 ** 21, info.size - 1);
      return new NextResponse(buf.subarray(start, end + 1), {
        status: 206,
        headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${info.size}`, "Content-Length": String(end - start + 1) },
      });
    }
    return new NextResponse(buf, { headers: { ...headers, "Content-Length": String(info.size) } });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
