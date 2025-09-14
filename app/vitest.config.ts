import { fileURLToPath } from "node:url";
import { mergeConfig, defineConfig, configDefaults } from "vitest/config";
import viteConfig from "./vite.config";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [react(), tailwindcss()],
    test: {
      environment: "jsdom",
      exclude: [...configDefaults.exclude, "e2e/**"],
      root: fileURLToPath(new URL("./", import.meta.url)),
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)), // This maps @ to src
      },
    },
  })
);
