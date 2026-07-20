import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { writeFileSync } from "fs";
import { resolve } from "path";

// Cloudflare Pages headers for optimization
const cfHeaders = `
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()
  Cross-Origin-Opener-Policy: same-origin-allow-popups
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable

/*.png
  Cache-Control: public, max-age=31536000, immutable

/*.jpg
  Cache-Control: public, max-age=31536000, immutable

/*.svg
  Cache-Control: public, max-age=31536000, immutable

/*.woff
  Cache-Control: public, max-age=31536000, immutable

/*.woff2
  Cache-Control: public, max-age=31536000, immutable

/index.html
  Cache-Control: public, max-age=0, must-revalidate
`;

// Cloudflare Pages redirects for SPA routing
const cfRedirects = `
/* /index.html 200
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
      "/auth": { target: "http://localhost:3001", changeOrigin: false },
      "/files": { target: "http://localhost:3001", changeOrigin: false },
      "/chat": { target: "http://localhost:3001", changeOrigin: false },
      "/leads": { target: "http://localhost:3001", changeOrigin: false },
      "/usage": { target: "http://localhost:3001", changeOrigin: false },
      "/settings": { target: "http://localhost:3001", changeOrigin: false },
      "/widget": { target: "http://localhost:3001", changeOrigin: false },
      "/health": { target: "http://localhost:3001", changeOrigin: false },
    },
  },
});
