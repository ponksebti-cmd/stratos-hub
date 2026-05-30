// routes/auth.js
import db from "../db.js";
import { signJWT, hashPassword, verifyPassword } from "../auth.js";
import { randomUUID } from "crypto";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function nextMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

export async function handleRegister(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { email, password, name } = body ?? {};
  if (!email || !password || !name) {
    return Response.json({ error: "email, password and name are required" }, { status: 400 });
  }

  // Check duplicate email
  const [existing] = await db`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
  if (existing) return Response.json({ error: "Email already registered" }, { status: 409 });

  const companyId = randomUUID();
  const userId    = randomUUID();
  const hash      = await hashPassword(password);

  // Insert company
  try {
    await db`INSERT INTO companies (id, name, email, plan, credits, renews_at)
             VALUES (${companyId}, ${name}, ${email}, 'starter', 1000, ${nextMonth()})`;
  } catch (companyErr) {
    console.error("company insert:", companyErr);
    return Response.json({ error: "Registration failed" }, { status: 500 });
  }

  // Insert user
  try {
    await db`INSERT INTO users (id, company_id, email, name, password, role)
             VALUES (${userId}, ${companyId}, ${email}, ${name}, ${hash}, 'admin')`;
  } catch (userErr) {
    console.error("user insert:", userErr);
    return Response.json({ error: "Registration failed" }, { status: 500 });
  }

  // Insert settings row
  await db`INSERT INTO settings (company_id) VALUES (${companyId})`;

  const token = await signJWT({ sub: userId, cid: companyId, role: "admin" });
  return Response.json({
    token,
    userId,
    companyId,
    user: { id: userId, email, name, role: "admin", companyId },
  });
}

export async function handleLogin(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { email, password } = body ?? {};
  if (!email || !password) return Response.json({ error: "email and password required" }, { status: 400 });

  const [user] = await db`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
  if (!user) return Response.json({ error: "Invalid credentials" }, { status: 401 });

  const ok = await verifyPassword(password, user.password);
  if (!ok) return Response.json({ error: "Invalid credentials" }, { status: 401 });

  const token = await signJWT({ sub: user.id, cid: user.company_id, role: user.role });
  return Response.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.company_id },
  });
}

export async function handleGoogleLogin(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { token } = body ?? {};
  if (!token) return Response.json({ error: "Token required" }, { status: 400 });

  let payload;
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch user info");
    payload = await res.json();
  } catch (e) {
    console.error("Google Auth Error:", e);
    return Response.json({ error: "Invalid token" }, { status: 400 });
  }

  const email = payload.email;
  const name  = payload.name || email.split("@")[0];

  let [user] = await db`SELECT * FROM users WHERE email = ${email} LIMIT 1`;

  if (!user) {
    const companyId = randomUUID();
    const userId    = randomUUID();
    const hash      = await hashPassword(randomUUID()); // random password for OAuth

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
