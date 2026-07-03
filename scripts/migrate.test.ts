import path from "node:path";
import { describe, expect, it } from "bun:test";
import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";

describe("migrate subcommand", () => {
  it("creates the schema without flags", () => {
    const dbPath = path.join(
      import.meta.dir,
      "test-migrate-" + Date.now() + ".db",
    );

    try {
      // Set a temporary database path and run the migrate subcommand.
      const output = execSync(
        `STUDYBUB_DB_PATH=${dbPath} bun run scripts/migrate.ts migrate`,
        {
          encoding: "utf8",
          cwd: path.join(import.meta.dir, ".."),
        },
      );

      expect(output).toContain("Migrate: schema created");
      expect(existsSync(dbPath)).toBe(true);
    } finally {
      // Clean up the test database.
      if (existsSync(dbPath)) {
        unlinkSync(dbPath);
      }
    }
  });
});
