import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import path from "node:path";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0", // <-- allow access from all network interfaces
    port: 5173, // optional, default is 5173
    strictPort: false, // if the port is taken, use another
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
