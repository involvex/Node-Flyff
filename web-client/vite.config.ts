import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as devtools from "@vitejs/devtools";

// https://vite.dev/config/

export default defineConfig({
  plugins: [react(), devtools.DevTools()],
  build: {
    outDir: "dist",
    copyPublicDir: true,
    emptyOutDir: true
    // assetsDir: "../data/assets",
  },
  define: {
    "process.env": process.env.WS_PROXY_PORT
      ? { WS_PROXY_PORT: process.env.WS_PROXY_PORT }
      : {},
    NODE_ENV: JSON.stringify(process.env.NODE_ENV || "development")
  },
  resolve: {
    alias: {
      "@": "/src"
    }
  },
  server: {
    allowedHosts: true,
    host: true,
    port: 4000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      }
    }
  }
});
