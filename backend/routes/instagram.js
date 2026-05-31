// routes/instagram.js — Instagram Graph API messaging integration
import db from "../db.js";
import { callLLM, executeTool, deductCredits } from "./chat.js";
import { decryptKey } from "../crypto.js";
import { randomUUID } from "crypto";

// ── Webhook Verification (GET) ────────────────────────────────────────────────
export async function handleInstagramVerification(req) {
  const url = new URL(req.url);
  const mode      = url.searchParams.get("hub.mode");
  const token     = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token) {
    const [setting] = await db`
      SELECT company_id FROM settings WHERE instagram_verify_token = ${token} LIMIT 1
    `;
    if (setting) {
      console.log("[instagram] Webhook verified");
      return new Response(challenge, { status: 200 });
    }
  }
  return new Response("Forbidden", { status: 403 });
}

// ── Inbound Message Handler (POST) ───────────────────────────────────────────
export async function handleInstagramMessage(req) {
  let body;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.object !== "instagram") return Response.json({ status: "ignored" });

  const entry     = body.entry?.[0];
  const accountId = entry?.id;
  const messaging = entry?.messaging?.[0];
  const message   = messaging?.message;
  const senderId  = messaging?.sender?.id;

  if (!message?.text || !senderId || !accountId) {
    return Response.json({ status: "ignored" });
  }

  const incomingText = message.text;

  // Find agency by Instagram Account ID
  let settings;
  try {
    [settings] = await db`
      SELECT company_id, instagram_token, openai_key_enc, openai_key_iv, openai_key_tag
      FROM settings
      WHERE instagram_account_id = ${accountId}
      LIMIT 1
    `;
  } catch (err) {
    console.error("[instagram] DB error:", err);
    return Response.json({ error: "Database error" }, { status: 500 });
  }

  if (!settings?.instagram_token) {
    console.error("[instagram] No agency configured for account:", accountId);
    return Response.json({ error: "Agency not configured" }, { status: 404 });
  }

  const companyId = settings.company_id;

  // Find or create session keyed by sender IGSID
  const sessionTitle = `Instagram: ${senderId}`;
  let [session] = await db`
    SELECT id FROM chat_sessions WHERE company_id = ${companyId} AND title = ${sessionTitle} LIMIT 1
  `;
  if (!session) {
    const sessionId = randomUUID();
    await db`INSERT INTO chat_sessions (id, company_id, title) VALUES (${sessionId}, ${companyId}, ${sessionTitle})`;
    session = { id: sessionId };
  }

  const sessionId = session.id;

  // Save user message
  await db`INSERT INTO messages (id, session_id, company_id, role, content) VALUES (${randomUUID()}, ${sessionId}, ${companyId}, 'user', ${incomingText})`;

  // Resolve API key
  let apiKey = process.env.GEMINI_API_KEY;
  let modelName = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";

  if (!apiKey && settings.openai_key_enc) {
    try {
      apiKey = await decryptKey({ enc: settings.openai_key_enc, iv: settings.openai_key_iv, tag: settings.openai_key_tag });
    } catch { console.error("[instagram] Key decryption failed"); }
  }

  if (!apiKey) {
    await sendInstagramMessage(accountId, settings.instagram_token, senderId, "AI configuration is missing. Please contact support.");
    return Response.json({ status: "error" });
  }

  // Get history and run AI loop
  const past = await db`SELECT role, content FROM messages WHERE session_id = ${sessionId} ORDER BY created_at ASC LIMIT 20`;
  const history = past.map(m => ({ role: m.role, content: m.content }));

  let finalContent = "";
  let success = false;
  try {
    let cur = [...history];
    for (let i = 0; i < 5; i++) {
      const resp = await callLLM(apiKey, cur, modelName);
      if (!resp.tool_calls?.length) { finalContent = resp.content ?? ""; success = true; break; }
      cur.push(resp);
      for (const tc of resp.tool_calls) {
        const { name, arguments: raw } = tc.function;
        const args = typeof raw === "string" ? JSON.parse(raw) : raw;
        const result = await executeTool(name, args, companyId, sessionId);
        cur.push({ role: "tool", tool_call_id: tc.id, name, content: result });
      }
    }
  } catch (err) {
    console.error("[instagram] AI failed:", err);
    finalContent = "I encountered an error. Please try again.";
  }

  const cleanReply = finalContent.replace(/<thought_process>[\s\S]*?<\/thought_process>/g, "").trim();

  await db`INSERT INTO messages (id, session_id, company_id, role, content) VALUES (${randomUUID()}, ${sessionId}, ${companyId}, 'assistant', ${cleanReply})`;
  await db`UPDATE chat_sessions SET updated_at = NOW() WHERE id = ${sessionId}`;
  await sendInstagramMessage(accountId, settings.instagram_token, senderId, cleanReply);
  if (success) await deductCredits(companyId);

  return Response.json({ status: "ok" });
}

// ── Send Instagram Message ────────────────────────────────────────────────────
async function sendInstagramMessage(accountId, token, recipientId, text) {
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${accountId}/messages`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
        messaging_type: "RESPONSE",
      }),
    });
    const data = await res.json();
    if (!res.ok) console.error("[instagram] Send error:", data);
    return data;
  } catch (err) {
    console.error("[instagram] Send failed:", err);
  }
}
