import { Database } from "bun:sqlite";

/**
 * The SQLite database instance for StudyBub. Uses a file-based database by
 * default; pass `:memory:` for testing.
 */
let dbInstance: Database | null = null;

/** Whether the database schema has been initialised. */
let schemaInitialised = false;

/**
 * Gets or creates the SQLite database instance. When `path` is omitted the
 * default file `studybub.db` is used in the current working directory.
 *
 * The database schema is lazily initialised on the first call so that
 * tables exist before any query is executed. This avoids importing the
 * native database module during SSR module evaluation.
 *
 * @param path - Optional path to the database file.
 * @returns The database instance.
 */
export function getDatabase(path?: string): Database {
  if (!dbInstance) {
    const resolvedPath = path ?? process.env.STUDYBUB_DB_PATH ?? "studybub.db";
    dbInstance = new Database(resolvedPath);
    dbInstance.run("PRAGMA journal_mode = WAL");
    dbInstance.run("PRAGMA foreign_keys = ON");
  }
  if (!schemaInitialised) {
    schemaInitialised = true;
    initSchema(dbInstance);
  }
  return dbInstance;
}

/**
 * Initialises the database schema, creating all required tables if they do
 * not already exist. This function is idempotent - it uses CREATE TABLE IF
 * NOT EXISTS so it is safe to call on every server start.
 *
 * The schema includes users, invite_tokens, webauthn_credentials,
 * notification_configurations, notification_test_proofs, and
 * notification_deliveries tables as defined in the data model.
 *
 * @param db - The database instance, defaults to the shared instance.
 */
export function initSchema(db?: Database): void {
  const database = db ?? getDatabase();

  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      progress_json TEXT NOT NULL DEFAULT '{}',
      ai_config_encrypted TEXT,
      ai_config_iv TEXT,
      ai_config_auth_tag TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS invite_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      consumed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS webauthn_credentials (
      credential_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
      public_key TEXT NOT NULL,
      counter INTEGER NOT NULL DEFAULT 0,
      transports TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // Index for looking up tokens by user.
  database.run(`
    CREATE INDEX IF NOT EXISTS idx_invite_tokens_user_id
    ON invite_tokens(user_id)
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS notification_configurations (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      topic_ciphertext TEXT NOT NULL,
      topic_iv TEXT NOT NULL,
      topic_auth_tag TEXT NOT NULL,
      reminder_time TEXT NOT NULL,
      timezone TEXT NOT NULL,
      activated_at TEXT NOT NULL,
      tested_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS notification_test_proofs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      topic_ciphertext TEXT NOT NULL,
      topic_iv TEXT NOT NULL,
      topic_auth_tag TEXT NOT NULL,
      reminder_time TEXT NOT NULL,
      timezone TEXT NOT NULL,
      succeeded_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      consumed_at TEXT
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS notification_deliveries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES notification_configurations(user_id) ON DELETE CASCADE,
      logical_key TEXT NOT NULL,
      kind TEXT NOT NULL,
      streak_count INTEGER NOT NULL,
      local_date TEXT NOT NULL,
      timezone TEXT NOT NULL,
      status TEXT NOT NULL,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      next_attempt_at TEXT NOT NULL,
      claim_until TEXT,
      expires_at TEXT NOT NULL,
      last_attempt_at TEXT,
      completed_at TEXT,
      last_result_code TEXT,
      ntfy_message_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, logical_key)
    )
  `);

  database.run(`
    CREATE INDEX IF NOT EXISTS idx_notification_test_proofs_user_expiry
    ON notification_test_proofs(user_id, expires_at)
  `);

  database.run(`
    CREATE INDEX IF NOT EXISTS idx_notification_deliveries_claim
    ON notification_deliveries(status, next_attempt_at)
  `);

  database.run(`
    CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user_status
    ON notification_deliveries(user_id, completed_at DESC)
  `);
}

/**
 * Resets the database singleton. Used in tests to ensure a clean state
 * between test runs.
 */
export function resetDatabase(): void {
  dbInstance = null;
  schemaInitialised = false;
}
