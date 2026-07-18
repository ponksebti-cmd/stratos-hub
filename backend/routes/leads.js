// routes/leads.js
import db from "../db.js";
import { requireAuth, unauthorized } from "../auth.js";
import { randomUUID } from "crypto";

export async function handleListLeads(req) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const leads = await db`
      SELECT id, name, phone, budget, city, property_type, source, status, score, created_at, session_id 
      FROM leads 
      WHERE company_id = ${user.company_id} 
      ORDER BY created_at DESC
    `;

    return Response.json(
      leads.map((l) => ({
        id: l.id,
        name: l.name,
        phone: l.phone,
        budget: l.budget,
        city: l.city,
        propertyType: l.property_type,
        source: l.source,
        status: l.status,
        score: l.score,
        createdAt: l.created_at,
        sessionId: l.session_id,
      }))
    );
  } catch (error) {
    console.error("list leads:", error);
    return Response.json({ error: "Failed to list leads" }, { status: 500 });
  }
}

export async function handleCreateLead(req) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { name, phone, budget, city, propertyType, source, status, score } = body ?? {};
  const id = randomUUID();

  try {
    await db`
      INSERT INTO leads (id, company_id, name, phone, budget, city, property_type, source, status, score)
      VALUES (${id}, ${user.company_id}, ${name ?? ""}, ${phone ?? ""}, ${Number(budget) || 0}, ${city ?? ""}, ${propertyType ?? ""}, ${source ?? "Manual"}, ${status ?? "new"}, ${score ?? 0})
    `;
  } catch (error) {
    console.error("create lead:", error);
    return Response.json({ error: "Failed to create lead" }, { status: 500 });
  }

  const [lead] = await db`
    SELECT id, name, phone, budget, city, property_type, source, status, score, created_at 
    FROM leads 
    WHERE id = ${id}
    LIMIT 1
  `;

  return Response.json(
    {
      id: lead.id, name: lead.name, phone: lead.phone,
      budget: lead.budget, city: lead.city,
      propertyType: lead.property_type,
      source: lead.source, status: lead.status,
      score: lead.score,
      createdAt: lead.created_at,
    },
    { status: 201 }
  );
}

export async function handleUpdateLead(req, id) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const [existing] = await db`SELECT id FROM leads WHERE id = ${id} AND company_id = ${user.company_id} LIMIT 1`;
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  // Map camelCase → snake_case for Postgres
  const fieldMap = {
    name: "name", phone: "phone", budget: "budget",
    city: "city", propertyType: "property_type",
    source: "source", status: "status", score: "score",
  };

  const updates = {};
  for (const [camel, snake] of Object.entries(fieldMap)) {
    if (body[camel] !== undefined) updates[snake] = body[camel];
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    await db`UPDATE leads SET ${db(updates)} WHERE id = ${id}`;
  } catch (error) {
    console.error("update lead:", error);
    return Response.json({ error: "Failed to update lead" }, { status: 500 });
  }

  const [lead] = await db`
    SELECT id, name, phone, budget, city, property_type, source, status, score, created_at 
    FROM leads 
    WHERE id = ${id} 
    LIMIT 1
  `;

  return Response.json({
    id: lead.id, name: lead.name, phone: lead.phone,
    budget: lead.budget, city: lead.city,
    propertyType: lead.property_type,
    source: lead.source, status: lead.status,
    score: lead.score,
    createdAt: lead.created_at,
  });
}

export async function handleDeleteLead(req, id) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const [existing] = await db`SELECT id FROM leads WHERE id = ${id} AND company_id = ${user.company_id} LIMIT 1`;
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  await db`DELETE FROM leads WHERE id = ${id}`;

  return Response.json({ ok: true });
}
