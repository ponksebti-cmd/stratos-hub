import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsConfigPaths(),
  ],
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
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
