// routes/usage.js
import db from "../db.js";
import { requireAuth, unauthorized } from "../auth.js";

export async function handleGetUsage(req) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  // Compute the date 6 days ago (inclusive of today = 7 days)
  const sixDaysAgo = new Date();
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
  const sinceDate = sixDaysAgo.toISOString().slice(0, 10);

  let rows = [];
  try {
    rows = await db`
      SELECT date, credits, chats 
      FROM usage 
      WHERE company_id = ${user.company_id} 
        AND date >= ${sinceDate}::date
      ORDER BY date ASC
    `;
  } catch (error) {
    console.error("get usage:", error);
    return Response.json({ error: "Failed to fetch usage" }, { status: 500 });
  }

  // Fill gaps with zeros for a complete 7-day series
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const row = rows.find((r) => r.date === iso);
    result.push({ date: label, credits: row?.credits ?? 0, chats: row?.chats ?? 0 });
  }

  return Response.json(result);
}
