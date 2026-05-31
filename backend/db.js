// db.js - PostgreSQL client using postgres.js
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("[db] WARNING: DATABASE_URL is not set. Database operations will fail.");
}

export const db = DATABASE_URL
  ? postgres(DATABASE_URL)
  : new Proxy({}, {
      get: () => () => Promise.reject(new Error("DATABASE_URL is not configured. Please set it in your environment variables.")),
    });

export default db;
