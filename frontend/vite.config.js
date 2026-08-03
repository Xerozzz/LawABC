import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// For local `npm run dev` (no VITE_API_URL): proxy /api to the local backend so
// same-origin relative requests work. In Docker dev, VITE_API_URL is set instead.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_API_TARGET || "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
