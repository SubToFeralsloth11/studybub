import { Database } from "bun:sqlite";
import { unlinkSync } from "node:fs";

import { getDatabase, initSchema, resetDatabase } from "./db.server";

describe("getDatabase", () => {
  afterEach(() => {
    resetDatabase();
  });

  it("returns a Database instance", () => {
    const db = getDatabase(":memory:");
    expect(db).toBeInstanceOf(Database);
  });

  it("returns the same instance on subsequent calls", () => {
    const db1 = getDatabase(":memory:");
    const db2 = getDatabase();
    expect(db1).toBe(db2);
  });

  // WAL journal mode is not available for :memory: databases. In-memory
  // databases use a built-in journal mode that returns "memory".
  it("uses memory journal mode for :memory: databases", () => {
    const db = getDatabase(":memory:");
    const result = db.query("PRAGMA journal_mode").get() as {
      journal_mode: string;
    };
    // :memory: databases report "memory" as the journal mode.
    expect(result.journal_mode).toBe("memory");
  });

  it("enables foreign keys", () => {
    const db = getDatabase(":memory:");
    const result = db.query("PRAGMA foreign_keys").get() as {
      foreign_keys: number;
    };
    expect(result.foreign_keys).toBe(1);
  });
});

describe("initSchema", () => {
  let db: Database;

  beforeEach(() => {
    resetDatabase();
    db = getDatabase(":memory:");
  });

  afterEach(() => {
    resetDatabase();
  });

  function tableNames(database: Database): string[] {
    return (
      database
        .query(
          "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
        )
        .all() as { name: string }[]
    ).map((row) => row.name);
  }

  it("creates the users, invite_tokens, webauthn_credentials, and notification tables", () => {
    initSchema(db);
    const tables = tableNames(db);
    expect(tables).toContain("users");
    expect(tables).toContain("invite_tokens");
    expect(tables).toContain("webauthn_credentials");
    expect(tables).toContain("notification_configurations");
    expect(tables).toContain("notification_test_proofs");
    expect(tables).toContain("notification_deliveries");
  });

  it("is idempotent - calling initSchema twice succeeds", () => {
    initSchema(db);
    expect(() => initSchema(db)).not.toThrow();
  });

  it("creates the invite_tokens user_id index", () => {
    initSchema(db);
    const indexes = db
      .query(
        "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_invite_tokens_user_id'",
      )
      .all();
    expect(indexes).toHaveLength(1);
  });

  it("creates indexes for notification tables", () => {
    initSchema(db);
    const indexNames = (
      db.query("SELECT name FROM sqlite_master WHERE type='index'").all() as {
        name: string;
      }[]
    ).map((row) => row.name);

    expect(indexNames).toContain("idx_notification_test_proofs_user_expiry");
    expect(indexNames).toContain("idx_notification_deliveries_claim");
    expect(indexNames).toContain("idx_notification_deliveries_user_status");
  });
});

describe("getDatabase with STUDYBUB_DB_PATH", () => {
  const original = process.env.STUDYBUB_DB_PATH;

  afterEach(() => {
    resetDatabase();
    if (original === undefined) {
      delete process.env.STUDYBUB_DB_PATH;
    } else {
      process.env.STUDYBUB_DB_PATH = original;
    }
  });

  it("uses STUDYBUB_DB_PATH when set and no path argument is given", () => {
    resetDatabase();
    process.env.STUDYBUB_DB_PATH = ":memory:";
    const db = getDatabase();
    const result = db.query("PRAGMA journal_mode").get() as {
      journal_mode: string;
    };
    // In-memory databases report "memory" as the journal mode.
    expect(result.journal_mode).toBe("memory");
  });

  it("falls back to default path when STUDYBUB_DB_PATH is unset", () => {
    resetDatabase();
    delete process.env.STUDYBUB_DB_PATH;
    // Should not throw; uses the default path "studybub.db".
    const db = getDatabase();
    expect(db).toBeInstanceOf(Database);
    // Clean up files created by the default path.
    try {
      unlinkSync("studybub.db");
    } catch {
      /* ok */
    }
    try {
      unlinkSync("studybub.db-wal");
    } catch {
      /* ok */
    }
    try {
      unlinkSync("studybub.db-shm");
    } catch {
      /* ok */
    }
  });
});

describe("CRUD on users table", () => {
  let db: Database;

  beforeEach(() => {
    resetDatabase();
    db = getDatabase(":memory:");
    initSchema(db);
  });

  afterEach(() => {
    resetDatabase();
  });

  it("inserts and reads a user row", () => {
    const now = new Date().toISOString();
    db.run(
      "INSERT INTO users (id, display_name, created_at, updated_at) VALUES (?, ?, ?, ?)",
      ["user-1", "Oscar", now, now],
    );
    const user = db
      .query("SELECT id, display_name FROM users WHERE id = ?")
      .get("user-1") as { id: string; display_name: string } | null;
    expect(user).not.toBeNull();
    expect(user!.id).toBe("user-1");
    expect(user!.display_name).toBe("Oscar");
  });

  it("updates a user row", () => {
    const now = new Date().toISOString();
    db.run(
      "INSERT INTO users (id, display_name, created_at, updated_at) VALUES (?, ?, ?, ?)",
      ["user-1", "Oscar", now, now],
    );
    db.run("UPDATE users SET display_name = ? WHERE id = ?", [
      "Oscar Updated",
      "user-1",
    ]);
    const user = db
      .query("SELECT display_name FROM users WHERE id = ?")
      .get("user-1") as { display_name: string } | null;
    expect(user!.display_name).toBe("Oscar Updated");
  });

  it("deletes a user row", () => {
    const now = new Date().toISOString();
    db.run(
      "INSERT INTO users (id, display_name, created_at, updated_at) VALUES (?, ?, ?, ?)",
      ["user-1", "Oscar", now, now],
    );
    db.run("DELETE FROM users WHERE id = ?", ["user-1"]);
    const user = db
      .query("SELECT id FROM users WHERE id = ?")
      .get("user-1") as { id: string } | null;
    expect(user).toBeNull();
  });

  it("initialises progress_json to empty object by default", () => {
    const now = new Date().toISOString();
    db.run(
      "INSERT INTO users (id, display_name, created_at, updated_at) VALUES (?, ?, ?, ?)",
      ["user-1", "Oscar", now, now],
    );
    const user = db
      .query("SELECT progress_json FROM users WHERE id = ?")
      .get("user-1") as { progress_json: string } | null;
    expect(user!.progress_json).toBe("{}");
  });
});

describe("Notification schema and cascade deletion", () => {
  let db: Database;
  const now = new Date().toISOString();

  beforeEach(() => {
    resetDatabase();
    db = getDatabase(":memory:");
    initSchema(db);
    db.run(
      "INSERT INTO users (id, display_name, created_at, updated_at) VALUES (?, ?, ?, ?)",
      ["user-1", "Learner", now, now],
    );
  });

  afterEach(() => {
    resetDatabase();
  });

  it("inserts and reads notification_configurations, notification_test_proofs, and notification_deliveries", () => {
    db.run(
      `INSERT INTO notification_configurations (
        user_id, topic_ciphertext, topic_iv, topic_auth_tag,
        reminder_time, timezone, activated_at, tested_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "user-1",
        "cipher123",
        "iv123",
        "tag123",
        "19:00",
        "Australia/Sydney",
        now,
        now,
        now,
        now,
      ],
    );

    db.run(
      `INSERT INTO notification_test_proofs (
        id, user_id, topic_ciphertext, topic_iv, topic_auth_tag,
        reminder_time, timezone, succeeded_at, expires_at, consumed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "proof-1",
        "user-1",
        "cipher123",
        "iv123",
        "tag123",
        "19:00",
        "Australia/Sydney",
        now,
        now,
        null,
      ],
    );

    db.run(
      `INSERT INTO notification_deliveries (
        id, user_id, logical_key, kind, streak_count, local_date,
        timezone, status, attempt_count, next_attempt_at, claim_until,
        expires_at, last_attempt_at, completed_at, last_result_code,
        ntfy_message_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "delivery-1",
        "user-1",
        "reminder:2026-08-22",
        "reminder",
        5,
        "2026-08-22",
        "Australia/Sydney",
        "pending",
        0,
        now,
        null,
        now,
        null,
        null,
        null,
        null,
        now,
        now,
      ],
    );

    const config = db
      .query("SELECT * FROM notification_configurations WHERE user_id = ?")
      .get("user-1") as Record<string, unknown> | null;
    expect(config).not.toBeNull();
    expect(config?.timezone).toBe("Australia/Sydney");
    expect(config?.reminder_time).toBe("19:00");

    const proof = db
      .query("SELECT * FROM notification_test_proofs WHERE id = ?")
      .get("proof-1") as Record<string, unknown> | null;
    expect(proof).not.toBeNull();
    expect(proof?.user_id).toBe("user-1");
    expect(proof?.consumed_at).toBeNull();

    const delivery = db
      .query("SELECT * FROM notification_deliveries WHERE id = ?")
      .get("delivery-1") as Record<string, unknown> | null;
    expect(delivery).not.toBeNull();
    expect(delivery?.logical_key).toBe("reminder:2026-08-22");
    expect(delivery?.streak_count).toBe(5);
  });

  it("enforces UNIQUE(user_id, logical_key) on notification_deliveries", () => {
    db.run(
      `INSERT INTO notification_configurations (
        user_id, topic_ciphertext, topic_iv, topic_auth_tag,
        reminder_time, timezone, activated_at, tested_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "user-1",
        "cipher123",
        "iv123",
        "tag123",
        "19:00",
        "Australia/Sydney",
        now,
        now,
        now,
        now,
      ],
    );

    db.run(
      `INSERT INTO notification_deliveries (
        id, user_id, logical_key, kind, streak_count, local_date,
        timezone, status, attempt_count, next_attempt_at, claim_until,
        expires_at, last_attempt_at, completed_at, last_result_code,
        ntfy_message_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "delivery-1",
        "user-1",
        "reminder:2026-08-22",
        "reminder",
        5,
        "2026-08-22",
        "Australia/Sydney",
        "pending",
        0,
        now,
        null,
        now,
        null,
        null,
        null,
        null,
        now,
        now,
      ],
    );

    expect(() => {
      db.run(
        `INSERT INTO notification_deliveries (
          id, user_id, logical_key, kind, streak_count, local_date,
          timezone, status, attempt_count, next_attempt_at, claim_until,
          expires_at, last_attempt_at, completed_at, last_result_code,
          ntfy_message_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "delivery-2",
          "user-1",
          "reminder:2026-08-22",
          "reminder",
          5,
          "2026-08-22",
          "Australia/Sydney",
          "pending",
          0,
          now,
          null,
          now,
          null,
          null,
          null,
          null,
          now,
          now,
        ],
      );
    }).toThrow();
  });

  it("cascades deletion from users to notification_configurations and notification_test_proofs", () => {
    db.run(
      `INSERT INTO notification_configurations (
        user_id, topic_ciphertext, topic_iv, topic_auth_tag,
        reminder_time, timezone, activated_at, tested_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "user-1",
        "cipher123",
        "iv123",
        "tag123",
        "19:00",
        "Australia/Sydney",
        now,
        now,
        now,
        now,
      ],
    );

    db.run(
      `INSERT INTO notification_test_proofs (
        id, user_id, topic_ciphertext, topic_iv, topic_auth_tag,
        reminder_time, timezone, succeeded_at, expires_at, consumed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "proof-1",
        "user-1",
        "cipher123",
        "iv123",
        "tag123",
        "19:00",
        "Australia/Sydney",
        now,
        now,
        null,
      ],
    );

    db.run(
      `INSERT INTO notification_deliveries (
        id, user_id, logical_key, kind, streak_count, local_date,
        timezone, status, attempt_count, next_attempt_at, claim_until,
        expires_at, last_attempt_at, completed_at, last_result_code,
        ntfy_message_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "delivery-1",
        "user-1",
        "reminder:2026-08-22",
        "reminder",
        5,
        "2026-08-22",
        "Australia/Sydney",
        "pending",
        0,
        now,
        null,
        now,
        null,
        null,
        null,
        null,
        now,
        now,
      ],
    );

    // Deleting the user should cascade delete configuration, test proofs, and deliveries.
    db.run("DELETE FROM users WHERE id = ?", ["user-1"]);

    const config = db
      .query("SELECT * FROM notification_configurations WHERE user_id = ?")
      .get("user-1");
    expect(config).toBeNull();

    const proof = db
      .query("SELECT * FROM notification_test_proofs WHERE id = ?")
      .get("proof-1");
    expect(proof).toBeNull();

    const delivery = db
      .query("SELECT * FROM notification_deliveries WHERE id = ?")
      .get("delivery-1");
    expect(delivery).toBeNull();
  });

  it("cascades deletion from notification_configurations to notification_deliveries", () => {
    db.run(
      `INSERT INTO notification_configurations (
        user_id, topic_ciphertext, topic_iv, topic_auth_tag,
        reminder_time, timezone, activated_at, tested_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "user-1",
        "cipher123",
        "iv123",
        "tag123",
        "19:00",
        "Australia/Sydney",
        now,
        now,
        now,
        now,
      ],
    );

    db.run(
      `INSERT INTO notification_deliveries (
        id, user_id, logical_key, kind, streak_count, local_date,
        timezone, status, attempt_count, next_attempt_at, claim_until,
        expires_at, last_attempt_at, completed_at, last_result_code,
        ntfy_message_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "delivery-1",
        "user-1",
        "reminder:2026-08-22",
        "reminder",
        5,
        "2026-08-22",
        "Australia/Sydney",
        "pending",
        0,
        now,
        null,
        now,
        null,
        null,
        null,
        null,
        now,
        now,
      ],
    );

    // Deleting notification_configuration should cascade delete deliveries.
    db.run("DELETE FROM notification_configurations WHERE user_id = ?", [
      "user-1",
    ]);

    const delivery = db
      .query("SELECT * FROM notification_deliveries WHERE id = ?")
      .get("delivery-1");
    expect(delivery).toBeNull();
  });
});
