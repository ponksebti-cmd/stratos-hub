// migrate.js — auto-create all tables/indexes/functions on startup
// Uses Bun's built-in SQL client (Bun >= 1.2) — no extra dependencies.
// Requires DATABASE_URL in .env (from Supabase: Settings → Database → Connection string → URI)

import { SQL } from "bun";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

export async function migrate() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.warn(
      "[migrate] DATABASE_URL not set — skipping auto-migration.\n" +
      "          Add it to .env to enable automatic table creation on startup."
    );
    return;
  }

  const schemaPath = join(__dir, "schema.sql");
  let schema;
  try {
    schema = readFileSync(schemaPath, "utf8");
  } catch (err) {
    console.error("[migrate] Could not read schema.sql:", err.message);
    return;
  }

  console.log("[migrate] Running schema migrations…");
  const sql = new SQL(DATABASE_URL);
  try {
    // unsafe() runs raw multi-statement SQL — safe here since schema.sql has no user input
    await sql.unsafe(schema);
    console.log("[migrate] Schema is up to date.");
  } catch (err) {
    console.error("[migrate] Migration failed:", err.message);
    // Non-fatal — server still starts; Supabase may already have the schema
  } finally {
    await sql.close({ timeout: 5 });
  }
}
