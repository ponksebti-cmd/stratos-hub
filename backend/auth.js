// auth.js — JWT sign/verify + password hashing via Bun built-ins
import db from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is missing. This is required for security.");
}

// ── Crypto helpers ────────────────────────────────────────────────────────────

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function getKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function fromB64url(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

// ── JWT ──────────────────────────────────────────────────────────────────────

export async function signJWT(payload) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 7 * 24 * 3600; // 7 days
  const header = b64url(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body   = b64url(encoder.encode(JSON.stringify({ ...payload, iat: now, exp })));
  const key    = await getKey(JWT_SECRET);
  const sig    = await crypto.subtle.sign("HMAC", key, encoder.encode(`${header}.${body}`));
  return `${header}.${body}.${b64url(sig)}`;
}

export async function verifyJWT(token) {
  try {
    const [header, body, sig] = token.split(".");
    if (!header || !body || !sig) return null;
    const key   = await getKey(JWT_SECRET);
    const valid = await crypto.subtle.verify(
      "HMAC", key,
      fromB64url(sig),
      encoder.encode(`${header}.${body}`)
    );
    if (!valid) return null;
    const parsed = JSON.parse(decoder.decode(fromB64url(body)));
    if (parsed.exp && parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ── Password hashing ─────────────────────────────────────────────────────────

export async function hashPassword(password) {
  return Bun.password.hash(password, { algorithm: "bcrypt", cost: 10 });
}

export async function verifyPassword(password, hash) {
  return Bun.password.verify(password, hash);
}

// ── Auth middleware ───────────────────────────────────────────────────────────

export async function requireAuth(req) {
  const auth  = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload) return null;

  try {
    const [user] = await db`SELECT * FROM users WHERE id = ${payload.sub} LIMIT 1`;
    if (!user) return null;
    return user;
  } catch (error) {
    console.error("requireAuth error:", error);
    return null;
  }
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
