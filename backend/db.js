// db.js - PostgreSQL client using postgres.js
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required in .env");
}

export const db = postgres(DATABASE_URL);

export default db;
