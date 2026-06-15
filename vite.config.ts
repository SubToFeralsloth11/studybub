import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Vite configuration for the StudyBub single-page application.
// React Fast Refresh and Tailwind v4 are wired in via plugins; no PostCSS step is needed.
// The base path is only set for production builds (e.g. GitHub Pages).
// In dev mode the base is "/" so that routes work without the repo-name prefix.
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/studybub/" : "/",
  plugins: [react(), tailwindcss()],
}));
