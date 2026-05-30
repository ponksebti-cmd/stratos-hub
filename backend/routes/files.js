// routes/files.js
import db from "../db.js";
import { requireAuth, unauthorized } from "../auth.js";
import { randomUUID } from "crypto";
import { unlinkSync, existsSync } from "fs";
import { join } from "path";

import { PDFParse } from "pdf-parse";
import { parse as csvParse } from "csv-parse/sync";

const UPLOADS_DIR = new URL("../uploads", import.meta.url).pathname;

export async function handleListFiles(req) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const files = await db`
      SELECT id, name, size, mime_type, status, uploaded_at 
      FROM files 
      WHERE company_id = ${user.company_id} 
      ORDER BY uploaded_at DESC
    `;

    return Response.json(
      files.map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.mime_type,
        status: f.status,
        uploadedAt: f.uploaded_at,
      }))
    );
  } catch (error) {
    console.error("list files:", error);
    return Response.json({ error: "Failed to list files" }, { status: 500 });
  }
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = ["application/pdf", "text/csv", "application/vnd.ms-excel"];

export async function handleUploadFile(req) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  let formData;
  try { formData = await req.formData(); } catch { return Response.json({ error: "Invalid form data" }, { status: 400 }); }

  const results = [];
  for (const [, file] of formData.entries()) {
    if (!(file instanceof File)) continue;

    if (file.size > MAX_FILE_SIZE) {
      results.push({ name: file.name, error: "File too large (max 10MB)", status: "failed" });
      continue;
    }

    const fileType = file.type || "application/octet-stream";
    if (!ALLOWED_MIME.includes(fileType) && !file.name.endsWith(".csv")) {
      results.push({ name: file.name, error: "Only PDF and CSV allowed", status: "failed" });
      continue;
    }

    const id = randomUUID();
    const ext = file.name.split(".").pop() ?? "bin";
    const storedName = `${id}.${ext}`;
    const filePath = join(UPLOADS_DIR, storedName);

    const buffer = await file.arrayBuffer();
    await Bun.write(filePath, buffer);

    try {
      await db`
        INSERT INTO files (id, company_id, name, size, mime_type, status, path)
        VALUES (${id}, ${user.company_id}, ${file.name}, ${file.size}, ${fileType}, 'processing', ${filePath})
      `;
    } catch (insertErr) {
      console.error("file insert:", insertErr);
      results.push({ name: file.name, error: "Upload failed", status: "failed" });
      continue;
    }

    // Process file asynchronously (non-blocking)
    processFileBackground(id, user.company_id, filePath, fileType);

    results.push({
      id, name: file.name, size: file.size,
      type: fileType, status: "processing",
      uploadedAt: new Date().toISOString(),
    });
  }

  return Response.json(results);
}

async function processFileBackground(id, companyId, filePath, mimeType) {
  try {
    let text = "";
    const buf = await Bun.file(filePath).arrayBuffer();

    if (mimeType === "application/pdf") {
      const parser = new PDFParse({ data: Buffer.from(buf) });
      try {
        const data = await parser.getText();
        text = data.text;
      } finally {
        await parser.destroy();
      }
    } else if (mimeType === "text/csv" || filePath.endsWith(".csv")) {
      const records = csvParse(Buffer.from(buf), { skip_empty_lines: true });
      text = records.map((row) => row.join(", ")).join("\n");
    }

    // Split into ~500-char chunks and insert into Postgres
    const chunkSize = 500;
    const inserts = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.slice(i, i + chunkSize).trim();
      if (chunk) {
        inserts.push({ id: randomUUID(), file_id: id, company_id: companyId, content: chunk });
      }
    }

    if (inserts.length > 0) {
      // postgres.js bulk insert
      await db`INSERT INTO file_chunks ${db(inserts, "id", "file_id", "company_id", "content")}`;
    }

    await db`UPDATE files SET status = 'ready' WHERE id = ${id}`;
  } catch (err) {
    console.error("File processing failed:", err);
    await db`UPDATE files SET status = 'failed' WHERE id = ${id}`;
  }
}

export async function handleDeleteFile(req, id) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const [file] = await db`SELECT * FROM files WHERE id = ${id} AND company_id = ${user.company_id} LIMIT 1`;

  if (!file) return Response.json({ error: "Not found" }, { status: 404 });

  try { if (existsSync(file.path)) unlinkSync(file.path); } catch { /* ignore */ }

  await db`DELETE FROM files WHERE id = ${id}`;

  return Response.json({ ok: true });
}
