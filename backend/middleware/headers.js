// middleware/headers.js — Security response headers
// Applied to every response, defence-in-depth against common web attacks.

const IS_PROD = process.env.NODE_ENV === "production"
  || (process.env.RAILWAY_ENVIRONMENT ?? "") !== "";

export const SECURITY_HEADERS = {
  // Prevent MIME-type sniffing
  "X-Content-Type-Options": "nosniff",
  // Deny framing — prevents clickjacking
  "X-Frame-Options": "DENY",
  // Legacy XSS filter (still useful for older browsers)
  "X-XSS-Protection": "1; mode=block",
  // Don't send full referrer to cross-origin destinations
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Disable unnecessary browser features
  "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=()",
  // Basic CSP for API responses (HTML is served as static)
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  // Force HTTPS in production
  ...(IS_PROD
    ? { "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload" }
    : {}),
};

export function applySecurityHeaders(response, pathname) {
  const isEmbed = pathname && pathname.startsWith("/embed/");
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    // Skip frame-blocking headers for embed routes (they need to load inside iframes)
    if (isEmbed && (k === "X-Frame-Options" || k === "Content-Security-Policy")) continue;
    if (!headers.has(k)) headers.set(k, v);
  }
  if (isEmbed) {
    // Allow embedding from any origin
    headers.set("Content-Security-Policy",
      "default-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; connect-src *; img-src * data:; frame-ancestors *;"
    );
  }
  // Remove server fingerprinting headers
  headers.delete("Server");
  headers.delete("X-Powered-By");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// CORS — public widget/webhook endpoints get wildcard,
// protected API endpoints only allow configured frontend origins.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? process.env.ALLOWED_ORIGIN ?? "*")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const PUBLIC_CORS_PATHS = [
  "/chat/widget",
  "/chat/whatsapp/webhook",
  "/chat/messenger/webhook",
  "/chat/instagram/webhook",
  "/chat/tiktok/webhook",
  "/widget/",
  "/embed/",
  "/health",
];

function isPublicCorsRoute(pathname) {
  return PUBLIC_CORS_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p)
  );
}

function resolveCorsOrigin(pathname, requestOrigin) {
  if (isPublicCorsRoute(pathname)) return "*";
  if (ALLOWED_ORIGINS.includes("*")) return "*";
  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin;
  return ALLOWED_ORIGINS[0] ?? "*";
}

export function getCORSHeaders(pathname, requestOrigin) {
  const origin = resolveCorsOrigin(pathname, requestOrigin);
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    ...(origin !== "*" ? { "Vary": "Origin" } : {}),
  };
}
