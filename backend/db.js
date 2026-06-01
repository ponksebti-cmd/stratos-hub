// db.js - PostgreSQL client using postgres.js
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("[db] ERROR: DATABASE_URL is not set. Database operations will fail.");
}

export const db = DATABASE_URL
  ? postgres(DATABASE_URL)
  : (() => {
      const error = new Error("DATABASE_URL is not configured. Please set it in your environment variables.");
      return new Proxy(() => {
        throw error;
      }, {
        get: () => () => {
          throw error;
        },
        apply: () => {
          throw error;
        },
      });
    })();

export default db;
