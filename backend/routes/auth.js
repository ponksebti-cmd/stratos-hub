// routes/auth.js
import db from "../db.js";
import { signJWT, hashPassword, verifyPassword } from "../auth.js";
import { randomUUID } from "crypto";
import { OAuth2Client } from "google-auth-library";
import {
  isValidEmail, isValidPassword,
  sanitizeString, checkContentLength,
} from "../middleware/validate.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function nextMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

export async function handleRegister(req) {
  if (!checkContentLength(req, 512 * 1024)) {
    return Response.json({ error: "Request body too large" }, { status: 413 });
  }

  let body;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, password, name } = body ?? {};

  // Validate email
  if (!isValidEmail(email)) {
    return Response.json({ error: "A valid email address is required" }, { status: 400 });
  }

  // Validate password strength
  if (!isValidPassword(password)) {
    return Response.json(
      { error: "Password must be between 8 and 128 characters" },
      { status: 400 }
    );
  }

  // Validate name
  const safeName = sanitizeString(name, 100);
  if (!safeName) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const safeEmail = sanitizeString(email, 254).toLowerCase();

  // Check duplicate email — use constant-time comparison via DB lookup
  const [existing] = await db`SELECT id FROM users WHERE email = ${safeEmail} LIMIT 1`;
  // Return generic message to avoid user enumeration
  if (existing) {
    return Response.json({ error: "Registration failed. Please try a different email." }, { status: 409 });
  }

  const companyId = randomUUID();
  const userId    = randomUUID();
  const hash      = await hashPassword(password);

  try {
    await db`INSERT INTO companies (id, name, email, plan, credits, renews_at)
             VALUES (${companyId}, ${safeName}, ${safeEmail}, 'starter', 1000, ${nextMonth()})`;
  } catch (companyErr) {
    console.error("company insert:", companyErr?.message);
    return Response.json({ error: "Registration failed" }, { status: 500 });
  }

  try {
    await db`INSERT INTO users (id, company_id, email, name, password, role)
             VALUES (${userId}, ${companyId}, ${safeEmail}, ${safeName}, ${hash}, 'admin')`;
  } catch (userErr) {
    console.error("user insert:", userErr?.message);
    // Roll back company
    await db`DELETE FROM companies WHERE id = ${companyId}`.catch(() => {});
    return Response.json({ error: "Registration failed" }, { status: 500 });
  }

  await db`INSERT INTO settings (company_id) VALUES (${companyId})`;

  const token = await signJWT({ sub: userId, cid: companyId, role: "admin" });
  return Response.json({ token, userId, companyId,
    user: { id: userId, email: safeEmail, name: safeName, role: "admin", companyId },
  });
}

export async function handleLogin(req) {
  if (!checkContentLength(req, 512 * 1024)) {
    return Response.json({ error: "Request body too large" }, { status: 413 });
  }

  let body;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, password } = body ?? {};

  if (!isValidEmail(email) || typeof password !== "string" || !password) {
    // Generic error — don't reveal which field was wrong (prevents enumeration)
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const safeEmail = sanitizeString(email, 254).toLowerCase();
  const [user] = await db`SELECT * FROM users WHERE email = ${safeEmail} LIMIT 1`;

  // Always run password hash to prevent timing attacks when user doesn't exist
  const dummyHash = "$2b$10$invalid.hash.to.prevent.timing.attacks.padding";
  const hashToVerify = user?.password ?? dummyHash;
  const ok = await verifyPassword(password, hashToVerify);

  if (!user || !ok) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signJWT({ sub: user.id, cid: user.company_id, role: user.role });
  return Response.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.company_id },
  });
}

export async function handleGoogleLogin(req) {
  if (!checkContentLength(req, 512 * 1024)) {
    return Response.json({ error: "Request body too large" }, { status: 413 });
  }

  let body;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { token } = body ?? {};
  if (typeof token !== "string" || !token || token.length > 4096) {
    return Response.json({ error: "Invalid token" }, { status: 400 });
  }

  let payload;
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("userinfo fetch failed");
    payload = await res.json();
  } catch {
    return Response.json({ error: "Invalid token" }, { status: 400 });
  }

  if (!payload?.email || !isValidEmail(payload.email)) {
    return Response.json({ error: "Invalid token" }, { status: 400 });
  }

  const email = sanitizeString(payload.email, 254).toLowerCase();
  const name  = sanitizeString(payload.name ?? email.split("@")[0], 100);

  let [user] = await db`SELECT * FROM users WHERE email = ${email} LIMIT 1`;

  if (!user) {
    const companyId = randomUUID();
    const userId    = randomUUID();
    const hash      = await hashPassword(randomUUID()); // random password for OAuth users

    await db`INSERT INTO companies (id, name, email, plan, credits, renews_at)
             VALUES (${companyId}, ${name + " Workspace"}, ${email}, 'starter', 1000, ${nextMonth()})`;
    await db`INSERT INTO users (id, company_id, email, name, password, role)
             VALUES (${userId}, ${companyId}, ${email}, ${name}, ${hash}, 'admin')`;
    await db`INSERT INTO settings (company_id) VALUES (${companyId})`;

    [user] = await db`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
  }

  const jwt = await signJWT({ sub: user.id, cid: user.company_id, role: user.role });
  return Response.json({
    token: jwt,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.company_id },
  });
}
