import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.REACT_APP_SERVER_URL": JSON.stringify(
      process.env.REACT_APP_SERVER_URL
    ),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    allowedHosts: [
      "8d9f-2409-40d0-1005-cdb3-a4af-16a7-d6f0-8c50.ngrok-free.app",
    ],
  },
});
