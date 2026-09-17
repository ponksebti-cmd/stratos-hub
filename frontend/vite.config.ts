import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { writeFileSync } from "fs";
import { resolve } from "path";

// Cloudflare Pages headers
// NOTE: Cloudflare _headers rules do NOT override each other — when a path
// matches multiple rules, headers from ALL matching rules are joined together.
// So keep rules non-overlapping: never combine a broad `/*` Cache-Control with
// more specific ones, or values get concatenated and browsers behave oddly.
const cfHeaders = `
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()
  Cross-Origin-Opener-Policy: same-origin-allow-popups

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;

export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsConfigPaths(),
    {
      name: "cloudflare-headers",
      writeBundle() {
        const headersPath = resolve(__dirname, "dist/client/_headers");
        writeFileSync(headersPath, cfHeaders.trim());
        // Note: No _redirects needed — Wrangler Assets handles SPA routing automatically
      },
    },
  ],
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
    proxy: {
      "^/auth/": {
        target: "http://localhost:3001",
        changeOrigin: false,
        bypass: (req) => (req.headers.accept?.includes("text/html") ? "/index.html" : undefined),
      },
      "/files": {
        target: "http://localhost:3001",
        changeOrigin: false,
        bypass: (req) =>
          req.headers.accept?.includes("text/html") ||
          (!req.headers.accept?.includes("application/json") && req.method === "GET")
            ? "/index.html"
            : undefined,
      },
      "/chat": {
        target: "http://localhost:3001",
        changeOrigin: false,
        bypass: (req) =>
          req.headers.accept?.includes("text/html") ||
          (!req.headers.accept?.includes("application/json") && req.method === "GET")
            ? "/index.html"
            : undefined,
      },
      "/leads": {
        target: "http://localhost:3001",
        changeOrigin: false,
        bypass: (req) =>
          req.headers.accept?.includes("text/html") ||
          (!req.headers.accept?.includes("application/json") && req.method === "GET")
            ? "/index.html"
            : undefined,
      },
      "/usage": {
        target: "http://localhost:3001",
        changeOrigin: false,
        bypass: (req) =>
          req.headers.accept?.includes("text/html") ||
          (!req.headers.accept?.includes("application/json") && req.method === "GET")
            ? "/index.html"
            : undefined,
      },
      "/settings": {
        target: "http://localhost:3001",
        changeOrigin: false,
        bypass: (req) =>
          req.headers.accept?.includes("text/html") ||
          (!req.headers.accept?.includes("application/json") && req.method === "GET")
            ? "/index.html"
            : undefined,
      },
      "/widget/config": {
        target: "http://localhost:3001",
        changeOrigin: false,
      },
      "/health": { target: "http://localhost:3001", changeOrigin: false },
    },
  },
});
