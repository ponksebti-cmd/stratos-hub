// routes/files.js
import db from "../db.js";
import { requireAuth, unauthorized } from "../auth.js";
import { randomUUID } from "crypto";
import { unlinkSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { sanitizeFilename, hasDangerousExtension, isValidUUID } from "../middleware/validate.js";

import { PDFParse } from "pdf-parse";
import { parse as csvParse } from "csv-parse/sync";

const UPLOADS_DIR = new URL("../uploads", import.meta.url).pathname;

// Ensure uploads directory exists
mkdirSync(UPLOADS_DIR, { recursive: true });

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
    console.error("list files:", error?.message);
    return Response.json({ error: "Failed to list files" }, { status: 500 });
  }
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file
const MAX_FILES_PER_REQUEST = 5;

// Allowed MIME types — validated against both type AND extension
const ALLOWED_MIME = new Set([
  "application/pdf",
  "text/csv",
  "application/vnd.ms-excel",
  "text/plain",
]);

const ALLOWED_EXTENSIONS = new Set(["pdf", "csv", "xls", "txt"]);

export async function handleUploadFile(req) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  let formData;
  try { formData = await req.formData(); } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const entries = [...formData.entries()].filter(([, v]) => v instanceof File);

  if (entries.length === 0) {
    return Response.json({ error: "No files provided" }, { status: 400 });
  }

  if (entries.length > MAX_FILES_PER_REQUEST) {
    return Response.json(
      { error: `Maximum ${MAX_FILES_PER_REQUEST} files per request` },
      { status: 400 }
    );
  }

  const results = [];

  for (const [, file] of entries) {
    const safeName = sanitizeFilename(file.name);
    const ext = safeName.split(".").pop()?.toLowerCase() ?? "";

    // Check for dangerous file extensions
    if (hasDangerousExtension(safeName)) {
      results.push({ name: file.name, error: "File type not allowed", status: "failed" });
      continue;
    }

    // Extension must be in allowlist
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      results.push({ name: file.name, error: "Only PDF and CSV files are allowed", status: "failed" });
      continue;
    }

    // File size check
    if (file.size > MAX_FILE_SIZE) {
      results.push({ name: file.name, error: "File too large (max 10 MB)", status: "failed" });
      continue;
    }

    // MIME type check — must be in allowlist OR extension is csv
    const fileType = file.type || "application/octet-stream";
    const mimeOk = ALLOWED_MIME.has(fileType) || ext === "csv";
    if (!mimeOk) {
      results.push({ name: file.name, error: "Only PDF and CSV files are allowed", status: "failed" });
      continue;
    }

    const id = randomUUID();
    const storedName = `${id}.${ext}`;
    const filePath = join(UPLOADS_DIR, storedName);

    const buffer = await file.arrayBuffer();
    await Bun.write(filePath, buffer);

    try {
      await db`
        INSERT INTO files (id, company_id, name, size, mime_type, status, path)
        VALUES (${id}, ${user.company_id}, ${safeName}, ${file.size}, ${fileType}, 'processing', ${filePath})
      `;
    } catch (insertErr) {
      console.error("file insert:", insertErr?.message);
      // Clean up written file on DB failure
      try { unlinkSync(filePath); } catch { /* ignore */ }
      results.push({ name: file.name, error: "Upload failed", status: "failed" });
      continue;
    }

    processFileBackground(id, user.company_id, filePath, fileType, ext);

    results.push({
      id, name: safeName, size: file.size,
      type: fileType, status: "processing",
      uploadedAt: new Date().toISOString(),
    });
  }

  return Response.json(results);
}

async function processFileBackground(id, companyId, filePath, mimeType, ext) {
  try {
    let text = "";
    const buf = await Bun.file(filePath).arrayBuffer();

    if (mimeType === "application/pdf" || ext === "pdf") {
      const parser = new PDFParse({ data: Buffer.from(buf) });
      try {
        const data = await parser.getText();
        text = data.text;
      } finally {
        await parser.destroy();
      }
    } else if (mimeType === "text/csv" || ext === "csv" || ext === "xls") {
      const records = csvParse(Buffer.from(buf), { skip_empty_lines: true });
      text = records.map((row) => row.join(", ")).join("\n");
    } else if (ext === "txt") {
      text = new TextDecoder().decode(buf);
    }

    // Truncate extremely large content (safety cap at 2 MB of text)
    text = text.slice(0, 2 * 1024 * 1024);

    const chunkSize = 500;
    const inserts = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.slice(i, i + chunkSize).trim();
      if (chunk) {
        inserts.push({ id: randomUUID(), file_id: id, company_id: companyId, content: chunk });
      }
    }

    if (inserts.length > 0) {
      await db`INSERT INTO file_chunks ${db(inserts, "id", "file_id", "company_id", "content")}`;
    }

    await db`UPDATE files SET status = 'ready' WHERE id = ${id}`;
  } catch (err) {
    console.error("File processing failed:", err?.message);
    await db`UPDATE files SET status = 'failed' WHERE id = ${id}`;
  }
}

export async function handleDeleteFile(req, id) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  // Validate ID format to prevent any injection attempts
  if (!isValidUUID(id)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const [file] = await db`
    SELECT * FROM files 
    WHERE id = ${id} AND company_id = ${user.company_id} 
    LIMIT 1
  `;

  if (!file) return Response.json({ error: "Not found" }, { status: 404 });

  // Verify path stays within uploads directory (prevent path traversal)
  const resolvedPath = file.path ? join(UPLOADS_DIR, join("/", file.path.replace(UPLOADS_DIR, ""))) : null;
  if (resolvedPath && existsSync(resolvedPath)) {
    try { unlinkSync(resolvedPath); } catch { /* ignore */ }
  }

  await db`DELETE FROM file_chunks WHERE file_id = ${id}`;
  await db`DELETE FROM files WHERE id = ${id}`;

  return Response.json({ ok: true });
}
