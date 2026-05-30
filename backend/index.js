// index.js — Bun HTTP server, main router
import { migrate } from "./migrate.js";

import { handleRegister, handleLogin, handleGoogleLogin } from "./routes/auth.js";
import { handleListFiles, handleUploadFile, handleDeleteFile } from "./routes/files.js";
import {
  handleListSessions, handleCreateSession,
  handleGetMessages, handleSendMessage,
  handleWidgetChat,
} from "./routes/chat.js";
import { handleWhatsAppVerification, handleWhatsAppMessage } from "./routes/whatsapp.js";
import { handleListLeads, handleCreateLead, handleUpdateLead, handleDeleteLead } from "./routes/leads.js";
import { handleGetUsage } from "./routes/usage.js";
import {
  handleGetSettings, handleUpdateSettings,
  handleSaveOpenAIKey, handleDeleteOpenAIKey,
  handleSaveWidgetConfig, handleGetWidgetConfig,
  handleSaveWhatsAppSettings, handleSaveSystemPrompt
} from "./routes/settings.js";

const PORT = Number(process.env.PORT ?? 3001);

// ── CORS headers ──────────────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function cors(response) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
  return new Response(response.body, { status: response.status, headers });
}

// ── URL helper ────────────────────────────────────────────────────────────────
function match(pathname, pattern) {
  const re = new RegExp("^" + pattern.replace(/:([a-z]+)/g, "([^/]+)") + "$");
  const m = pathname.match(re);
  return m ? m.slice(1) : null;
}

// ── Startup ───────────────────────────────────────────────────────────────────
await migrate();

// ── Router ────────────────────────────────────────────────────────────────────
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Preflight
    if (method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

    let response;

    // Auth
    if (method === "POST" && path === "/auth/register")  response = await handleRegister(req);
    else if (method === "POST" && path === "/auth/login") response = await handleLogin(req);
    else if (method === "POST" && path === "/auth/google") response = await handleGoogleLogin(req);

    // Files
    else if (method === "GET"    && path === "/files")    response = await handleListFiles(req);
    else if (method === "POST"   && path === "/files")    response = await handleUploadFile(req);
    else if (method === "DELETE" && match(path, "/files/:id")) {
      const [id] = match(path, "/files/:id");
      response = await handleDeleteFile(req, id);
    }

    // Chat sessions
    else if (method === "GET"  && path === "/chat/sessions") response = await handleListSessions(req);
    else if (method === "POST" && path === "/chat/sessions") response = await handleCreateSession(req);
    else if (method === "POST" && path === "/chat/widget")   response = await handleWidgetChat(req);
    else if (method === "GET"  && path === "/chat/whatsapp/webhook") response = await handleWhatsAppVerification(req);
    else if (method === "POST" && path === "/chat/whatsapp/webhook") response = await handleWhatsAppMessage(req);
    else if (method === "GET"  && match(path, "/chat/sessions/:id/messages")) {
      const [id] = match(path, "/chat/sessions/:id/messages");
      response = await handleGetMessages(req, id);
    }
    else if (method === "POST" && match(path, "/chat/sessions/:id/messages")) {
      const [id] = match(path, "/chat/sessions/:id/messages");
      response = await handleSendMessage(req, id);
    }

    // Leads
    else if (method === "GET"   && path === "/leads")           response = await handleListLeads(req);
    else if (method === "POST"  && path === "/leads")           response = await handleCreateLead(req);
    else if (method === "PATCH" && match(path, "/leads/:id")) {
      const [id] = match(path, "/leads/:id");
      response = await handleUpdateLead(req, id);
    }
    else if (method === "DELETE" && match(path, "/leads/:id")) {
      const [id] = match(path, "/leads/:id");
      response = await handleDeleteLead(req, id);
    }

    // Usage
    else if (method === "GET" && path === "/usage") response = await handleGetUsage(req);

    // Settings
    else if (method === "GET"    && path === "/settings")            response = await handleGetSettings(req);
    else if (method === "PATCH"  && path === "/settings")            response = await handleUpdateSettings(req);
    else if (method === "PUT"    && path === "/settings/openai-key") response = await handleSaveOpenAIKey(req);
    else if (method === "DELETE" && path === "/settings/openai-key") response = await handleDeleteOpenAIKey(req);
    else if (method === "PUT"    && path === "/settings/system-prompt") response = await handleSaveSystemPrompt(req);
    else if (method === "PUT"    && path === "/settings/whatsapp")   response = await handleSaveWhatsAppSettings(req);
    else if (method === "PUT"    && path === "/settings/widget")     response = await handleSaveWidgetConfig(req);
    else if (method === "GET"    && path.startsWith("/widget/config/")) {
      const agencyId = path.split("/").pop();
      req.agencyId = agencyId; // Pass it along
      response = await handleGetWidgetConfig(req);
    }

    // Health check
    else if (path === "/health") response = Response.json({ status: "ok", timestamp: new Date().toISOString() });

    else response = Response.json({ error: "Not found" }, { status: 404 });

    return cors(response);
  },

  error(err) {
    console.error("[server error]", err);
    return cors(Response.json({ error: "Internal server error" }, { status: 500 }));
  },
});

console.log(`🚀 Stratos Hub backend running on http://localhost:${PORT}`);
