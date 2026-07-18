import db from "../db.js";
import { callLLM, executeTool, deductCredits } from "./chat.js";
import { decryptKey } from "../crypto.js";
import { randomUUID } from "crypto";

// ── WhatsApp Webhook Verification ───────────────────────────────────────────
export async function handleWhatsAppVerification(req) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token) {
    // We need to check if this token matches any agency's verify token
    const [setting] = await db`SELECT company_id FROM settings WHERE whatsapp_verify_token = ${token} LIMIT 1`;

    if (setting) {
      console.log("[whatsapp] Webhook verified!");
      return new Response(challenge, { status: 200 });
    }
  }

  return new Response("Forbidden", { status: 403 });
}

// ── WhatsApp Inbound Message Handler ─────────────────────────────────────────
export async function handleWhatsAppMessage(req) {
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const message = value?.messages?.[0];

  if (!message || message.type !== "text") {
    // Currently only supporting text messages
    return Response.json({ status: "ignored" });
  }

  const userPhone = message.from;
  const incomingText = message.text.body;
  const whatsappPhoneId = value.metadata.phone_number_id;

  // 1. Find the agency associated with this WhatsApp Phone ID
  let settings;
  try {
    [settings] = await db`
      SELECT company_id, whatsapp_token, openai_key_enc, openai_key_iv, openai_key_tag 
      FROM settings 
      WHERE whatsapp_phone_id = ${whatsappPhoneId} 
      LIMIT 1
    `;
  } catch (error) {
    console.error(`[whatsapp] Error fetching settings for phone ID: ${whatsappPhoneId}`, error);
    return Response.json({ error: "Database error" }, { status: 500 });
  }

  if (!settings || !settings.whatsapp_token) {
    console.error(`[whatsapp] No settings found for phone ID: ${whatsappPhoneId}`);
    return Response.json({ error: "Agency not configured" }, { status: 404 });
  }

  const companyId = settings.company_id;

  // 2. Identify or Create a Chat Session for this WhatsApp user
  const sessionTitle = `WhatsApp: ${userPhone}`;
  let [session] = await db`
    SELECT id 
    FROM chat_sessions 
    WHERE company_id = ${companyId} AND title = ${sessionTitle} 
    LIMIT 1
  `;

  if (!session) {
    const sessionId = randomUUID();
    try {
      await db`
        INSERT INTO chat_sessions (id, company_id, title)
        VALUES (${sessionId}, ${companyId}, ${sessionTitle})
      `;
      session = { id: sessionId };
    } catch (sessionError) {
      console.error("[whatsapp] Failed to create session:", sessionError);
      return Response.json({ error: "Internal Error" }, { status: 500 });
    }
  }

  const sessionId = session.id;

  // 3. Process with AI
  await db`
    INSERT INTO messages (id, session_id, company_id, role, content)
    VALUES (${randomUUID()}, ${sessionId}, ${companyId}, 'user', ${incomingText})
  `;

  // Get AI Credentials
  let apiKey = process.env.GEMINI_API_KEY;
  let modelName = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

  if (!apiKey && settings.openai_key_enc) {
    try {
      apiKey = await decryptKey({
        enc: settings.openai_key_enc,
        iv: settings.openai_key_iv,
        tag: settings.openai_key_tag,
      });
    } catch (e) {
      console.error("[whatsapp] API Key decryption failed");
    }
  }

  if (!apiKey) {
    await sendWhatsAppMessage(whatsappPhoneId, settings.whatsapp_token, userPhone, "I'm sorry, my AI configuration is missing. Please contact support.");
    return Response.json({ status: "error", message: "API Key missing" });
  }

  // Get History
  const pastMessages = await db`
    SELECT role, content 
    FROM messages 
    WHERE session_id = ${sessionId} 
    ORDER BY created_at ASC 
    LIMIT 20
  `;

  const history = pastMessages.map(m => ({ role: m.role, content: m.content }));

  // AI Loop
  let finalContent = "";
  let success = false;
  try {
    let currentHistory = [...history];
    let attempts = 0;
    while (attempts < 5) {
      attempts++;
      const responseMessage = await callLLM(apiKey, currentHistory, modelName);

      if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
        finalContent = responseMessage.content ?? "";
        success = true;
        break;
      }

      currentHistory.push(responseMessage);

      for (const toolCall of responseMessage.tool_calls) {
        const { name, arguments: rawArgs } = toolCall.function;
        let args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
        const result = await executeTool(name, args, companyId, sessionId);
        currentHistory.push({ role: "tool", tool_call_id: toolCall.id, name, content: result });
      }
    }
  } catch (err) {
    console.error("[whatsapp] AI Agent failed:", err);
    finalContent = "I'm sorry, I encountered an error while processing your request.";
  }

  // Clean the response (remove thought tags if any)
  const cleanReply = finalContent.replace(/<thought_process>[\s\S]*?<\/thought_process>/g, "").trim();

  // Save AI response
  await db`
    INSERT INTO messages (id, session_id, company_id, role, content)
    VALUES (${randomUUID()}, ${sessionId}, ${companyId}, 'assistant', ${cleanReply})
  `;

  // Update session
  await db`UPDATE chat_sessions SET updated_at = NOW() WHERE id = ${sessionId}`;

  // Send to WhatsApp
  await sendWhatsAppMessage(whatsappPhoneId, settings.whatsapp_token, userPhone, cleanReply);

  // Deduct credits
  if (success) {
    await deductCredits(companyId);
  }

  return Response.json({ status: "ok" });
}

// ── Outbound WhatsApp Message ───────────────────────────────────────────────
async function sendWhatsAppMessage(phoneId, token, to, text) {
  try {
    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: { body: text },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("[whatsapp] Meta API Error:", data);
    }
    return data;
  } catch (err) {
    console.error("[whatsapp] Failed to send message:", err);
  }
}
