import "server-only";
import { db, schema } from "@/lib/db";

export type ActivityType =
  | "login"
  | "logout"
  | "login_failed"
  | "view_product"
  | "view_collection"
  | "search"
  | "shortlist_add"
  | "shortlist_remove"
  | "consultation_request"
  | "session_revoked"
  | "account_disabled"
  | "account_enabled"
  | "password_reset"
  | "catalogue_updated"
  | "client_created"
  | "client_updated"
  | "product_updated"
  | "product_created";

export async function logActivity(e: {
  actorType: "client" | "admin";
  actorId?: string | null;
  clientId?: string | null;
  productId?: string | null;
  type: ActivityType;
  detail?: string | null;
}) {
  await db.insert(schema.activity).values({
    actorType: e.actorType,
    actorId: e.actorId ?? null,
    clientId: e.clientId ?? null,
    productId: e.productId ?? null,
    type: e.type,
    detail: e.detail ?? null,
  });
}
