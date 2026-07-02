// routes/tiktok.js — TikTok for Business Messaging API integration
import db from "../db.js";
import { callLLM, executeTool, deductCredits } from "./chat.js";
import { decryptKey } from "../crypto.js";
import { randomUUID } from "crypto";
import { createHmac } from "crypto";

// ── Webhook Verification (GET) ────────────────────────────────────────────────
// TikTok sends a challenge string that must be echoed back
export async function handleTikTokVerification(req) {
  const url = new URL(req.url);
  const challenge   = url.searchParams.get("challenge");
  const appId       = url.searchParams.get("app_id");

  if (challenge && appId) {
    // Verify this app_id belongs to a configured agency
    const [setting] = await db`
      SELECT company_id FROM settings WHERE tiktok_app_id = ${appId} LIMIT 1
    `;
    if (setting) {
      console.log("[tiktok] Webhook verified for app:", appId);
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
  }

  // Fallback: echo challenge without agency check (TikTok sometimes skips app_id)
  if (challenge) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }

  return new Response("Forbidden", { status: 403 });
}

// ── Inbound Message Handler (POST) ───────────────────────────────────────────
export async function handleTikTokMessage(req) {
  let body;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // TikTok Business Messaging webhook payload structure
  // https://business-api.tiktok.com documentation
  const event = body?.data?.[0];
  const imData = event?.data;

  if (!imData?.content || !imData?.from_user_id || !imData?.to_user_id) {
    console.log("[tiktok] Ignored non-message event");
    return Response.json({ status: "ignored" });
  }

  const senderUserId   = imData.from_user_id;
  const agencyUserId   = imData.to_user_id;
  const conversationId = imData.conversation_id;
  const incomingText   = imData.content;

  // Find agency by TikTok account user ID
  let settings;
  try {
    [settings] = await db`
      SELECT company_id, tiktok_access_token, tiktok_app_secret, openai_key_enc, openai_key_iv, openai_key_tag
      FROM settings
      WHERE tiktok_account_id = ${agencyUserId}
      LIMIT 1
    `;
  } catch (err) {
    console.error("[tiktok] DB error:", err);
    return Response.json({ error: "Database error" }, { status: 500 });
  }

  if (!settings?.tiktok_access_token) {
    console.error("[tiktok] No agency configured for account:", agencyUserId);
    return Response.json({ error: "Agency not configured" }, { status: 404 });
  }

  const companyId = settings.company_id;

  // Find or create session keyed by sender TikTok user ID
  const sessionTitle = `TikTok: ${senderUserId}`;
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
  let modelName = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

  if (!apiKey && settings.openai_key_enc) {
    try {
      apiKey = await decryptKey({ enc: settings.openai_key_enc, iv: settings.openai_key_iv, tag: settings.openai_key_tag });
    } catch { console.error("[tiktok] Key decryption failed"); }
  }

  if (!apiKey) {
    await sendTikTokMessage(settings.tiktok_access_token, conversationId, "AI configuration is missing. Please contact support.");
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
    console.error("[tiktok] AI failed:", err);
    finalContent = "I encountered an error. Please try again.";
  }

  const cleanReply = finalContent.replace(/<thought_process>[\s\S]*?<\/thought_process>/g, "").trim();

  await db`INSERT INTO messages (id, session_id, company_id, role, content) VALUES (${randomUUID()}, ${sessionId}, ${companyId}, 'assistant', ${cleanReply})`;
  await db`UPDATE chat_sessions SET updated_at = NOW() WHERE id = ${sessionId}`;
  await sendTikTokMessage(settings.tiktok_access_token, conversationId, cleanReply);
  if (success) await deductCredits(companyId);

  return Response.json({ code: 0, message: "ok" });
}

// ── Send TikTok DM ────────────────────────────────────────────────────────────
async function sendTikTokMessage(accessToken, conversationId, text) {
  try {
    const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/messaging/message/send/", {
      method: "POST",
      headers: {
        "Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        message_type: "text",
        text: { text },
      }),
    });
    const data = await res.json();
    if (data.code !== 0) console.error("[tiktok] Send error:", data);
    return data;
  } catch (err) {
    console.error("[tiktok] Send failed:", err);
  }
}
