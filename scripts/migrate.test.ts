import { describe, expect, it } from "bun:test";
import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";

describe("migrate subcommand", () => {
  it("creates the schema without flags", () => {
    const dbPath = join(
      import.meta.dir,
      "test-migrate-" + Date.now() + ".db",
    );

    try {
      // Set a temporary database path and run the migrate subcommand.
      const output = execSync(
        `STUDYBUB_DB_PATH=${dbPath} bun run scripts/migrate.ts migrate`,
        {
          encoding: "utf-8",
          cwd: join(import.meta.dir, ".."),
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
