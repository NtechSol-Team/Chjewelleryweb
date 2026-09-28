/** Creates the first production admin without seeding public demo credentials. */
import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../lib/db/schema";

const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "CH Jewels Administrator";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error("DATABASE_URL is required");
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Set BOOTSTRAP_ADMIN_EMAIL to a valid email address");
}
if (!password || password.length < 16) {
  throw new Error("Set BOOTSTRAP_ADMIN_PASSWORD to a password of at least 16 characters");
}

const client = postgres(databaseUrl, { max: 1 });
const db = drizzle(client, { schema });

async function main() {
  try {
    const [existingAdmin] = await db.select({ id: schema.admins.id }).from(schema.admins).limit(1);
    if (existingAdmin) {
      console.log("An admin already exists; leaving existing credentials unchanged.");
    } else {
      await db.insert(schema.admins).values({
        email,
        name,
        role: "Director, Private Clients",
        passwordHash: await bcrypt.hash(password, 12),
      });
      console.log(`Created the initial admin account for ${email}.`);
    }
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
