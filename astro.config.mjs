import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://wakadori.me",
  output: "static",
  integrations: [react(), sitemap()],
  build: {
    format: "directory",
  },
  vite: {
    // The static app has no build-time secrets. Pages Functions receive bindings at runtime.
    envDir: false,
  },
});
