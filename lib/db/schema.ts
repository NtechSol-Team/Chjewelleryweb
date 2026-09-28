import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const clientStatus = pgEnum("client_status", ["active", "disabled"]);
export const productStatus = pgEnum("product_status", ["published", "draft", "archived"]);
export const mediaKind = pgEnum("media_kind", ["image", "video", "spin"]);
export const subjectType = pgEnum("subject_type", ["client", "admin"]);
export const revokeReason = pgEnum("revoke_reason", [
  "logout",
  "superseded",
  "admin",
  "disabled",
  "timeout",
]);

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("manager"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  salutation: text("salutation"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  company: text("company"),
  city: text("city"),
  email: text("email"),
  phone: text("phone"),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  status: clientStatus("status").notNull().default("active"),
  accessStartsAt: timestamp("access_starts_at", { withTimezone: true }),
  accessEndsAt: timestamp("access_ends_at", { withTimezone: true }),
  advisor: text("advisor"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline"),
  description: text("description"),
  coverUrl: text("cover_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Spec = { label: string; value: string };

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    gender: text("gender").notNull().default("FEMALE"),
    shape: text("shape"),
    collectionId: uuid("collection_id").references(() => collections.id, { onDelete: "set null" }),
    description: text("description"),
    specifications: jsonb("specifications").$type<Spec[]>().notNull().default([]),
    status: productStatus("status").notNull().default("published"),
    isNew: boolean("is_new").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("products_collection_idx").on(t.collectionId), index("products_category_idx").on(t.category)],
);

export const productMedia = pgTable(
  "product_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    kind: mediaKind("kind").notNull(),
    url: text("url").notNull(),
    posterUrl: text("poster_url"),
    frames: jsonb("frames").$type<string[]>(),
    alt: text("alt"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("media_product_idx").on(t.productId)],
);

export const clientCollections = pgTable(
  "client_collections",
  {
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.clientId, t.collectionId] })],
);

export const clientProducts = pgTable(
  "client_products",
  {
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.clientId, t.productId] })],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: text("token_hash").notNull(),
    subjectType: subjectType("subject_type").notNull(),
    subjectId: uuid("subject_id").notNull(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedReason: revokeReason("revoked_reason"),
  },
  (t) => [
    uniqueIndex("sessions_token_idx").on(t.tokenHash),
    index("sessions_subject_idx").on(t.subjectType, t.subjectId),
  ],
);

export const shortlist = pgTable(
  "shortlist",
  {
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.clientId, t.productId] })],
);

export const productViews = pgTable(
  "product_views",
  {
    id: uuid("id").primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    lastPingAt: timestamp("last_ping_at", { withTimezone: true }).notNull().defaultNow(),
    durationMs: integer("duration_ms").notNull().default(0),
  },
  (t) => [index("views_client_idx").on(t.clientId), index("views_product_idx").on(t.productId), index("views_started_idx").on(t.startedAt)],
);

export const activity = pgTable(
  "activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorType: subjectType("actor_type").notNull(),
    actorId: uuid("actor_id"),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    type: text("type").notNull(),
    detail: text("detail"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activity_created_idx").on(t.createdAt), index("activity_client_idx").on(t.clientId)],
);

export const consultations = pgTable("consultations", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  productIds: jsonb("product_ids").$type<string[]>().notNull(),
  preference: text("preference"),
  message: text("message"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

export type Client = typeof clients.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type ProductMedia = typeof productMedia.$inferSelect;
export type Session = typeof sessions.$inferSelect;
