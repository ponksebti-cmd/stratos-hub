// middleware/validate.js — Input validation and sanitization helpers

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,63}$/;

// Validates basic email format and length (RFC 5321 limits)
export function isValidEmail(email) {
  return (
    typeof email === "string" &&
    email.length >= 3 &&
    email.length <= 254 &&
    EMAIL_RE.test(email)
  );
}

// Password: 8–128 chars
export function isValidPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 128
  );
}

// Trim and clamp a string field — returns "" if not a string
export function sanitizeString(str, maxLen = 255) {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLen);
}

// UUID v4 format check
export function isValidUUID(str) {
  return (
    typeof str === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
  );
}

// Safely parse a positive integer
export function safeInt(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

// Validate lead status enum
const LEAD_STATUSES = new Set(["new", "contacted", "qualified", "lost", "won"]);
export function isValidLeadStatus(status) {
  return typeof status === "string" && LEAD_STATUSES.has(status);
}

// Strip null bytes and control characters from strings (prevents log injection)
export function stripControlChars(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

// Sanitize a filename — strip path separators and dangerous characters
export function sanitizeFilename(name) {
  if (typeof name !== "string") return "upload";
  return name
    .replace(/[/\\:*?"<>|]/g, "_")  // path/shell-dangerous chars
    .replace(/\.{2,}/g, ".")          // collapse ".." sequences
    .replace(/^\./, "_")              // no leading dots (hidden files)
    .trim()
    .slice(0, 255) || "upload";
}

// Allowed file extensions (must match MIME type check in files.js)
const DANGEROUS_EXTENSIONS = new Set([
  "exe", "bat", "cmd", "com", "msi", "sh", "ps1", "vbs",
  "js", "jsx", "ts", "tsx", "php", "py", "rb", "pl",
  "jar", "war", "ear", "dll", "so", "dylib",
  "html", "htm", "svg", "xml",
]);

export function hasDangerousExtension(filename) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return DANGEROUS_EXTENSIONS.has(ext);
}

// Request body size guard (call before req.json())
export function checkContentLength(req, maxBytes = 1 * 1024 * 1024) {
  const len = req.headers.get("content-length");
  if (len && Number(len) > maxBytes) return false;
  return true;
}
