// routes/settings.js
import db from "../db.js";
import { requireAuth, unauthorized } from "../auth.js";
import { encryptKey, decryptKey } from "../crypto.js";

export async function handleGetSettings(req) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const [company] = await db`
    SELECT id, name, email, phone, plan, credits, renews_at 
    FROM companies 
    WHERE id = ${user.company_id} 
    LIMIT 1
  `;

  if (!company) return Response.json({ error: "Not found" }, { status: 404 });

  const [settings] = await db`
    SELECT system_prompt, openai_key_enc, widget_config, whatsapp_phone_id, whatsapp_business_id, whatsapp_token, whatsapp_verify_token 
    FROM settings 
    WHERE company_id = ${user.company_id} 
    LIMIT 1
  `;

  const hasOpenAIKey = !!settings?.openai_key_enc;
  const hasWhatsApp = !!settings?.whatsapp_token;
  let widgetConfig = null;
  
  if (settings?.widget_config) {
    widgetConfig = typeof settings.widget_config === 'string' 
      ? JSON.parse(settings.widget_config) 
      : settings.widget_config;
  }

  return Response.json({
    company: {
      id: company.id,
      name: company.name,
      email: company.email,
      phone: company.phone ?? "",
    },
    subscription: {
      plan: company.plan,
      creditsLeft: company.credits,
      renewsAt: company.renews_at,
    },
    hasOpenAIKey,
    hasWhatsApp,
    systemPrompt: settings?.system_prompt ?? "",
    whatsapp: {
      phoneId: settings?.whatsapp_phone_id ?? "",
      businessId: settings?.whatsapp_business_id ?? "",
      verifyToken: settings?.whatsapp_verify_token ?? "",
    },
    widgetConfig,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}

export async function handleUpdateSettings(req) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { name, email, phone } = body ?? {};
  const companyUpdates = {};

  if (name) companyUpdates.name = name;

  if (email) {
    // Check if email belongs to another company
    const [existing] = await db`
      SELECT id FROM companies WHERE email = ${email} AND id != ${user.company_id} LIMIT 1
    `;

    if (existing) return Response.json({ error: "Email already taken" }, { status: 409 });

    // Also update the admin user's email
    await db`UPDATE users SET email = ${email} WHERE company_id = ${user.company_id} AND role = 'admin'`;

    companyUpdates.email = email;
  }

  if (phone !== undefined) companyUpdates.phone = phone;

  if (Object.keys(companyUpdates).length > 0) {
    try {
      await db`UPDATE companies SET ${db(companyUpdates)} WHERE id = ${user.company_id}`;
    } catch (error) {
      console.error("update settings:", error);
      return Response.json({ error: "Failed to update settings" }, { status: 500 });
    }
  }

  return Response.json({ ok: true });
}

export async function handleSaveOpenAIKey(req) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { apiKey } = body ?? {};
  if (!apiKey?.startsWith("sk-")) {
    return Response.json({ error: "Invalid OpenAI key format" }, { status: 400 });
  }

  const { enc, iv, tag } = await encryptKey(apiKey);

  try {
    await db`
      INSERT INTO settings (company_id, openai_key_enc, openai_key_iv, openai_key_tag)
      VALUES (${user.company_id}, ${enc}, ${iv}, ${tag})
      ON CONFLICT (company_id) DO UPDATE SET 
        openai_key_enc = EXCLUDED.openai_key_enc,
        openai_key_iv = EXCLUDED.openai_key_iv,
        openai_key_tag = EXCLUDED.openai_key_tag
    `;
  } catch (error) {
    console.error("save openai key:", error);
    return Response.json({ error: "Failed to save API key" }, { status: 500 });
  }

  return Response.json({ ok: true });
}

export async function handleDeleteOpenAIKey(req) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    await db`UPDATE settings SET openai_key_enc = NULL, openai_key_iv = NULL, openai_key_tag = NULL WHERE company_id = ${user.company_id}`;
  } catch (error) {
    console.error("delete openai key:", error);
    return Response.json({ error: "Failed to delete API key" }, { status: 500 });
  }

  return Response.json({ ok: true });
}

export async function handleSaveWidgetConfig(req) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  try {
    await db`
      INSERT INTO settings (company_id, widget_config)
      VALUES (${user.company_id}, ${body})
      ON CONFLICT (company_id) DO UPDATE SET widget_config = EXCLUDED.widget_config
    `;
  } catch (error) {
    console.error("save widget config:", error);
    return Response.json({ error: "Failed to save widget config" }, { status: 500 });
  }

  return Response.json({ ok: true });
}

export async function handleSaveWhatsAppSettings(req) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { phoneId, businessId, token, verifyToken } = body ?? {};

  try {
    await db`
      INSERT INTO settings (company_id, whatsapp_phone_id, whatsapp_business_id, whatsapp_token, whatsapp_verify_token)
      VALUES (${user.company_id}, ${phoneId}, ${businessId}, ${token}, ${verifyToken})
      ON CONFLICT (company_id) DO UPDATE SET 
        whatsapp_phone_id = EXCLUDED.whatsapp_phone_id,
        whatsapp_business_id = EXCLUDED.whatsapp_business_id,
        whatsapp_token = EXCLUDED.whatsapp_token,
        whatsapp_verify_token = EXCLUDED.whatsapp_verify_token
    `;
  } catch (error) {
    console.error("save whatsapp settings:", error);
    return Response.json({ error: "Failed to save WhatsApp settings" }, { status: 500 });
  }

  return Response.json({ ok: true });
}

export async function handleGetWidgetConfig(req) {
  const agencyId = req.agencyId;
  if (!agencyId) return Response.json({ error: "agencyId required" }, { status: 400 });

  const [settings] = await db`SELECT widget_config FROM settings WHERE company_id = ${agencyId} LIMIT 1`;

  if (!settings?.widget_config) {
    return Response.json({ 
      color: "#6366f1", 
      name: "Property Assistant", 
      greeting: "Hi! I can help you find your perfect property. What are you looking for?", 
      theme: "light",
      position: "right"
    });
  }

  const config = typeof settings.widget_config === 'string' 
    ? JSON.parse(settings.widget_config) 
    : settings.widget_config;

  return Response.json(config);
}


export async function handleSaveSystemPrompt(req) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { prompt } = body ?? {};

  try {
    await db`
      INSERT INTO settings (company_id, system_prompt)
      VALUES (${user.company_id}, ${prompt})
      ON CONFLICT (company_id) DO UPDATE SET system_prompt = EXCLUDED.system_prompt
    `;
  } catch (error) {
    console.error("save system prompt:", error);
    return Response.json({ error: "Failed to save system prompt" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
