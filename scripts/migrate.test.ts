import path from "node:path";
import { Database } from "bun:sqlite";
import { describe, expect, it } from "bun:test";
import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
describe("migrate subcommand", () => {
  it("creates the schema without flags including notification tables and indexes", () => {
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

      const db = new Database(dbPath);
      const tables = (
        db
          .query(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
          )
          .all() as { name: string }[]
      ).map((row) => row.name);

      expect(tables).toContain("users");
      expect(tables).toContain("invite_tokens");
      expect(tables).toContain("webauthn_credentials");
      expect(tables).toContain("notification_configurations");
      expect(tables).toContain("notification_test_proofs");
      expect(tables).toContain("notification_deliveries");

      const indexNames = (
        db.query("SELECT name FROM sqlite_master WHERE type='index'").all() as {
          name: string;
        }[]
      ).map((row) => row.name);

      expect(indexNames).toContain("idx_invite_tokens_user_id");
      expect(indexNames).toContain("idx_notification_test_proofs_user_expiry");
      expect(indexNames).toContain("idx_notification_deliveries_claim");
      expect(indexNames).toContain("idx_notification_deliveries_user_status");
      db.close();
    } finally {
      // Clean up the test database.
      for (const file of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
        if (existsSync(file)) {
          try {
            unlinkSync(file);
          } catch {
            /* ok */
          }
        }
      }
    }
  });
});
