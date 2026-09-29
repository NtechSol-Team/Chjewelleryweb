/** Creates the first production admin without seeding public demo credentials. */
import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../lib/db/schema";

/**
 * Reads and validates an env var, returning a definite `string`. A plain
 * top-level `if (!x) throw` narrows `x` for the rest of this module, but that
 * narrowing does not survive into `main()`, which runs later as its own
 * closure — returning from a function that is itself typed `string` sidesteps
 * that TypeScript limitation instead of fighting it.
 */
function requireEnv(value: string | undefined, message: string, validate?: (v: string) => boolean): string {
  if (!value || (validate && !validate(value))) throw new Error(message);
  return value;
}

const email = requireEnv(
  process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase(),
  "Set BOOTSTRAP_ADMIN_EMAIL to a valid email address",
  (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
);
const password = requireEnv(
  process.env.BOOTSTRAP_ADMIN_PASSWORD,
  "Set BOOTSTRAP_ADMIN_PASSWORD to a password of at least 16 characters",
  (v) => v.length >= 16,
);
const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "CH Jewels Administrator";
const databaseUrl = requireEnv(process.env.DATABASE_URL, "DATABASE_URL is required");

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
