import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

/**
 * TanStack Start Vite configuration for StudyBub.
 *
 * The TanStack Start plugin provides the SSR framework, Nitro handles the
 * server build with the Bun preset, and Tailwind CSS processes styles. The
 * React Vite plugin must come after the TanStack Start plugin.
 */
export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [tailwindcss(), tanstackStart(), nitro(), viteReact()],
});
