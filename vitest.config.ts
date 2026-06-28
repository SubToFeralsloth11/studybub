import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// App (component and domain) Vitest configuration.
//
// This is the main suite: it runs under the Node runtime via the default `vitest`
// invocation (fast jsdom/React execution). The V8 coverage provider scopes
// coverage to the non-server source tree and enforces the project-mandated 80%
// thresholds over that slice.
//
// Server-side tests live under `src/server/` and run separately under Bun via
// `vitest.server.config.ts`, because they import `bun:sqlite`. That project uses
// the Istanbul provider, since V8 cannot collect coverage under Bun's runtime.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    // The app suite is full of jsdom component-integration tests that mount
    // the full router/provider tree via `renderApp` (12 test files). Under
    // CPU contention the first render + assertions of a test can exceed the
    // 5s default and flake. A 15s timeout gives those heavy mounts reliable
    // headroom without masking genuinely-hung unit tests (the domain tests
    // run in milliseconds).
    testTimeout: 15_000,
    passWithNoTests: true,
    setupFiles: ["./tests/setup.ts", "./src/test/mocks.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["src/server/**", "node_modules/**", ".output/**", ".vinxi/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/server/**",
        "src/**/*.test.{ts,tsx}",
        "src/main.tsx",
        "src/routeTree.gen.ts",
        "src/test/**",
        "src/**/*.d.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
