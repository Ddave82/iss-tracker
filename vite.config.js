import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 950
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api/iss/current": {
        target: "https://api.wheretheiss.at",
        changeOrigin: true,
        rewrite: () => "/v1/satellites/25544"
      },
      "/api/iss/fallback": {
        target: "http://api.open-notify.org",
        changeOrigin: true,
        rewrite: () => "/iss-now.json"
      }
    }
  }
});
