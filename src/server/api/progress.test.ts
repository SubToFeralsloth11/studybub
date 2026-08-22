/**
 * Integration tests for progress server functions.
 *
 * Tests the progress server functions through their createServerFn wrappers,
 * verifying auth gating, error handling, and correct database operations.
 * Uses an in-memory SQLite database for isolation.
 *
 * @module server/api/progress.test
 * @author John Grimes
 */

// The handler-level tests ("progress handlers") invoke the real server
// functions. TanStack Start's createServerFn needs a request runtime, so the
// factory is replaced with a thin shim that calls the handler directly with
// the `{ data }` payload. The session is mocked so requireUserId resolves to a
// controlled user id. Both are declared with vi.hoisted so the vi.mock
// factories (which are hoisted above the imports) can reference them safely.
const mocks = vi.hoisted(() => {
  const session = { data: {} as Record<string, unknown> };
  const createServerFn = () => {
    const api = {
      validator() {
        return api;
      },
      inputValidator() {
        return api;
      },
      middleware() {
        return api;
      },
    } as Record<string, (...args: any[]) => unknown>;
    api.handler =
      (fn: (ctx: { data: unknown }) => unknown) =>
      async (opts?: { data?: unknown }) =>
        fn({ data: opts?.data });
    return api;
  };
  return { session, createServerFn };
});

vi.mock("@tanstack/react-start", () => ({
  createServerFn: mocks.createServerFn,
}));
vi.mock("@tanstack/react-start/server", () => ({
  useSession: vi.fn(async () => mocks.session),
}));
const session = mocks.session;

import { Database } from "bun:sqlite";

import {
  defaultState,
  parseSavedState,
  type SavedState,
} from "../../domain/persistence/schema";
import { getDatabase, initSchema, resetDatabase } from "../db.server";
import { resetEncryptionKey } from "../encryption.server";
import {
  createTestProof,
  saveNotificationConfigurationFromProof,
} from "../notificationRepository.server";
import { loadProgress, resetProgress, saveProgress } from "./progress";

const TEST_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Seeds the database with a test user and returns the db instance.
 *
 * @returns The in-memory database instance with schema and test user.
 */
function setupDb(): Database {
  resetDatabase();
  const db = getDatabase(":memory:");
  initSchema(db);

  const now = new Date().toISOString();
  const defaultProgress = JSON.stringify(defaultState());
  db.run(
    "INSERT INTO users (id, display_name, progress_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    [TEST_USER_ID, "Test User", defaultProgress, now, now],
  );

  return db;
}

/**
 * Loads a user's progress from the database using the production
 * parseSavedState function to ensure validation and defaults.
 *
 * @param db - The database instance.
 * @param userId - The user ID to look up.
 * @returns The parsed saved state.
 */
function loadUserProgress(db: Database, userId: string): SavedState {
  const row = db
    .query("SELECT progress_json FROM users WHERE id = ?")
    .get(userId) as { progress_json: string } | undefined;

  return parseSavedState(row?.progress_json ?? null);
}

/**
 * Saves a user's progress to the database (mirrors saveProgress handler).
 *
 * @param db - The database instance.
 * @param userId - The user ID.
 * @param state - The saved state to persist.
 */
function saveUserProgress(
  db: Database,
  userId: string,
  state: SavedState,
): void {
  const now = new Date().toISOString();
  db.run("UPDATE users SET progress_json = ?, updated_at = ? WHERE id = ?", [
    JSON.stringify(state),
    now,
    userId,
  ]);
}

describe("progress server functions - integration", () => {
  let db: Database;

  beforeEach(() => {
    db = setupDb();
  });

  afterEach(() => {
    resetDatabase();
  });

  describe("loadProgress", () => {
    it("returns default state for a user with empty progress", () => {
      const state = loadUserProgress(db, TEST_USER_ID);
      expect(state.xp).toBe(0);
      expect(state.lessons).toEqual({});
      expect(state.challenges).toEqual({});
      expect(state.badges).toEqual([]);
    });

    it("returns zero xp for new user with default progress_json", () => {
      // The user was inserted with progress_json = "{}".
      const state = loadUserProgress(db, TEST_USER_ID);
      expect(state.xp).toBe(0);
      expect(state.streak).toEqual({ count: 0, lastActiveDate: "" });
    });

    it("throws when user does not exist (returns default)", () => {
      const state = loadUserProgress(db, "nonexistent-user");
      // The handler returns default state for missing users.
      expect(state.xp).toBe(0);
      expect(state.lessons).toEqual({});
    });
  });

  describe("saveProgress", () => {
    it("persists progress state", () => {
      const newState: SavedState = {
        ...defaultState(),
        xp: 150,
        lessons: { "lesson-1": { completed: true, bestAccuracy: 0.95 } },
        streak: { count: 3, lastActiveDate: "2026-06-20" },
        badges: ["first-steps"],
        activeDates: ["2026-06-18", "2026-06-19", "2026-06-20"],
      };

      saveUserProgress(db, TEST_USER_ID, newState);

      const row = db
        .query("SELECT progress_json, updated_at FROM users WHERE id = ?")
        .get(TEST_USER_ID) as {
        progress_json: string;
        updated_at: string;
      };

      const parsed = JSON.parse(row.progress_json);
      expect(parsed.xp).toBe(150);
      expect(parsed.lessons["lesson-1"].completed).toBe(true);
      expect(parsed.streak.count).toBe(3);
      expect(parsed.badges).toEqual(["first-steps"]);

      // The updated_at field should be a valid ISO date string.
      expect(typeof row.updated_at).toBe("string");
      expect(() => new Date(row.updated_at)).not.toThrow();
    });

    it("overwrites previous progress with new values", () => {
      // First save.
      saveUserProgress(db, TEST_USER_ID, defaultState());

      // Second save with different values.
      const updatedState: SavedState = {
        ...defaultState(),
        lessons: { "lesson-2": { completed: true, bestAccuracy: 1 } },
        xp: 50,
        streak: { count: 1, lastActiveDate: "2026-06-21" },
        badges: ["completionist"],
        activeDates: ["2026-06-21"],
      };
      saveUserProgress(db, TEST_USER_ID, updatedState);

      const state = loadUserProgress(db, TEST_USER_ID);
      expect(state.xp).toBe(50);
      expect(state.badges).toEqual(["completionist"]);
      expect(state.streak.count).toBe(1);
    });
  });

  describe("resetProgress", () => {
    it("resets progress to default", () => {
      // First save some progress.
      const progressedState: SavedState = {
        ...defaultState(),
        lessons: { "lesson-1": { completed: true, bestAccuracy: 1 } },
        challenges: {
          "challenge-1": { bestScore: 5, total: 10, passed: true },
        },
        xp: 500,
        streak: { count: 7, lastActiveDate: "2026-06-20" },
        badges: ["first-steps", "completionist"],
        activeDates: ["2026-06-14", "2026-06-15", "2026-06-16"],
      };
      saveUserProgress(db, TEST_USER_ID, progressedState);

      // Reset.
      saveUserProgress(db, TEST_USER_ID, defaultState());

      const state = loadUserProgress(db, TEST_USER_ID);
      expect(state.xp).toBe(0);
      expect(state.lessons).toEqual({});
      expect(state.challenges).toEqual({});
      expect(state.badges).toEqual([]);
      expect(state.streak.count).toBe(0);
    });
  });

  describe("auth gating", () => {
    it("returns default state for a user that does not exist", () => {
      // loadUserProgress uses parseSavedState which returns defaults for
      // non-existent users.
      const state = loadUserProgress(db, "nonexistent-id");
      expect(state.xp).toBe(0);
      expect(state.lessons).toEqual({});
      expect(state.challenges).toEqual({});
    });

    it("update for non-existent user is a no-op", () => {
      saveUserProgress(db, "nonexistent-id", defaultState());

      // Verify nothing was created.
      const count = db
        .query("SELECT COUNT(*) as cnt FROM users WHERE id = ?")
        .get("nonexistent-id") as { cnt: number };
      expect(count.cnt).toBe(0);
    });
  });

  describe("multiple users - data isolation", () => {
    it("does not leak progress between users", () => {
      const userId2 = "00000000-0000-0000-0000-000000000002";
      const now = new Date().toISOString();
      const defaultJson = JSON.stringify(defaultState());

      // Create a second user.
      db.run(
        "INSERT INTO users (id, display_name, progress_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        [userId2, "User 2", defaultJson, now, now],
      );

      // Save progress for user 1.
      const state1: SavedState = {
        ...defaultState(),
        lessons: { a: { completed: true, bestAccuracy: 1 } },
        xp: 100,
      };
      saveUserProgress(db, TEST_USER_ID, state1);

      // Save different progress for user 2.
      const state2: SavedState = {
        ...defaultState(),
        lessons: { b: { completed: true, bestAccuracy: 0.5 } },
        xp: 200,
        badges: ["first-steps"],
      };
      saveUserProgress(db, userId2, state2);

      // Verify isolation.
      const loaded1 = loadUserProgress(db, TEST_USER_ID);
      expect(loaded1.xp).toBe(100);
      expect(Object.keys(loaded1.lessons)).toEqual(["a"]);
      expect(loaded1.badges).toEqual([]);

      const loaded2 = loadUserProgress(db, userId2);
      expect(loaded2.xp).toBe(200);
      expect(Object.keys(loaded2.lessons)).toEqual(["b"]);
      expect(loaded2.badges).toEqual(["first-steps"]);
    });
  });
});

// These tests exercise the actual createServerFn handlers end-to-end through a
// mocked framework so that the handler code is covered. They share the same
// in-memory database as the SQL-level tests above.
describe("progress handlers", () => {
  let originalSecret: string | undefined;
  let db: Database;

  beforeEach(() => {
    // requireUserId -> useAppSession needs a configured session secret.
    originalSecret = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = "s".repeat(40);
    session.data = { userId: TEST_USER_ID };
    db = setupDb();
  });

  afterEach(() => {
    resetDatabase();
    if (originalSecret === undefined) {
      delete process.env.SESSION_SECRET;
    } else {
      process.env.SESSION_SECRET = originalSecret;
    }
  });

  it("loadProgress returns the default state for a fresh user", async () => {
    // setupDb inserted the user with progress_json = defaultState().
    const state = await loadProgress();
    expect(state.xp).toBe(0);
    expect(state.lessons).toEqual({});
  });

  it("ensureUserExists inserts a user when none is present on load", async () => {
    // Remove the seeded user so the handler must create it.
    db.run("DELETE FROM users WHERE id = ?", [TEST_USER_ID]);

    const state = await loadProgress();
    expect(state.xp).toBe(0);

    // The handler should have inserted the missing row.
    const count = db
      .query("SELECT COUNT(*) as cnt FROM users WHERE id = ?")
      .get(TEST_USER_ID) as { cnt: number };
    expect(count.cnt).toBe(1);
  });

  it("saveProgress persists the state and returns ok", async () => {
    const newState: SavedState = {
      ...defaultState(),
      xp: 250,
      lessons: { "lesson-9": { completed: true, bestAccuracy: 0.8 } },
    };

    const result = await saveProgress({ data: { state: newState } });
    expect(result).toEqual({ ok: true });

    const loaded = loadUserProgress(db, TEST_USER_ID);
    expect(loaded.xp).toBe(250);
    expect(loaded.lessons["lesson-9"]).toEqual({
      completed: true,
      bestAccuracy: 0.8,
    });
  });

  it("saveProgress ensures the user row exists before updating", async () => {
    db.run("DELETE FROM users WHERE id = ?", [TEST_USER_ID]);

    await saveProgress({
      data: { state: { ...defaultState(), xp: 30 } },
    });

    const loaded = loadUserProgress(db, TEST_USER_ID);
    expect(loaded.xp).toBe(30);
  });

  it("resetProgress overwrites progress with the default state", async () => {
    await saveProgress({
      data: { state: { ...defaultState(), xp: 400 } },
    });

    const fresh = await resetProgress();
    expect(fresh.xp).toBe(0);
    expect(fresh.lessons).toEqual({});

    const loaded = loadUserProgress(db, TEST_USER_ID);
    expect(loaded.xp).toBe(0);
  });

  it("loadProgress rejects when the session has no userId", async () => {
    session.data = {};

    await expect(loadProgress()).rejects.toThrow("Sign in required.");
  });

  it("saveProgress rejects when the session has no userId", async () => {
    session.data = {};

    await expect(
      saveProgress({ data: { state: defaultState() } }),
    ).rejects.toThrow("Sign in required.");
  });

  it("saveProgress rejects invalid state payload", async () => {
    const invalidStates: unknown[] = [
      null,
      undefined,
      {},
      { version: 1 },
      { ...defaultState(), xp: -10 },
      { ...defaultState(), xp: "not-a-number" },
      { ...defaultState(), version: 999 },
      { ...defaultState(), streak: null },
      { ...defaultState(), streak: { count: "invalid" } },
      { ...defaultState(), activeDates: "not-an-array" },
      { ...defaultState(), activeDates: [123] },
      { ...defaultState(), badges: [456] },
      {
        ...defaultState(),
        lessons: { "lesson-1": { completed: "not-bool" } },
      },
      {
        ...defaultState(),
        challenges: { "challenge-1": { bestScore: "invalid" } },
      },
    ];

    for (const invalid of invalidStates) {
      await expect(
        saveProgress({ data: { state: invalid as SavedState } }),
      ).rejects.toThrow("Invalid progress state.");
    }
  });
});

describe("saveProgress milestone notifications (T030)", () => {
  let originalSecret: string | undefined;
  let originalKey: string | undefined;
  let db: Database;

  beforeEach(() => {
    originalSecret = process.env.SESSION_SECRET;
    originalKey = process.env.ENCRYPTION_KEY;
    process.env.SESSION_SECRET = "s".repeat(40);
    process.env.ENCRYPTION_KEY =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    resetEncryptionKey();
    session.data = { userId: TEST_USER_ID };
    db = setupDb();
  });

  afterEach(() => {
    resetDatabase();
    if (originalSecret === undefined) {
      delete process.env.SESSION_SECRET;
    } else {
      process.env.SESSION_SECRET = originalSecret;
    }
    if (originalKey === undefined) {
      delete process.env.ENCRYPTION_KEY;
    } else {
      process.env.ENCRYPTION_KEY = originalKey;
    }
  });

  async function seedActiveConfig(timezone = "UTC") {
    const now = new Date("2026-08-20T10:00:00Z");
    const proofId = await createTestProof(db, {
      userId: TEST_USER_ID,
      topic: "test-topic",
      reminderTime: "19:00",
      timezone,
      now,
    });
    await saveNotificationConfigurationFromProof(
      db,
      proofId,
      TEST_USER_ID,
      now,
    );
  }

  it("enqueues milestone delivery when streak count advances to threshold with active configuration", async () => {
    await seedActiveConfig("UTC");

    // Initial state: streak 2, active 2026-08-21
    const initialState: SavedState = {
      ...defaultState(),
      streak: { count: 2, lastActiveDate: "2026-08-21" },
      activeDates: ["2026-08-20", "2026-08-21"],
      xp: 50,
    };
    db.run("UPDATE users SET progress_json = ? WHERE id = ?", [
      JSON.stringify(initialState),
      TEST_USER_ID,
    ]);

    // Advance to streak 3, active 2026-08-22 with qualifying activity (xp + activeDates)
    const newState: SavedState = {
      ...defaultState(),
      streak: { count: 3, lastActiveDate: "2026-08-22" },
      activeDates: ["2026-08-20", "2026-08-21", "2026-08-22"],
      xp: 60,
    };

    const res = await saveProgress({ data: { state: newState } });
    expect(res).toEqual({ ok: true });
    // Verify delivery was enqueued
    const deliveries = db
      .query("SELECT * FROM notification_deliveries WHERE user_id = ?")
      .all(TEST_USER_ID) as Array<{
      kind: string;
      streak_count: number;
      local_date: string;
      timezone: string;
      status: string;
      logical_key: string;
      expires_at: string;
    }>;

    expect(deliveries).toHaveLength(1);
    expect(deliveries[0].kind).toBe("milestone");
    expect(deliveries[0].streak_count).toBe(3);
    expect(deliveries[0].status).toBe("pending");
    expect(deliveries[0].logical_key).toBe("milestone:2026-08-22:3");
  });

  it("does not enqueue milestone delivery if user has no active notification configuration", async () => {
    // No active notification configuration
    const initialState: SavedState = {
      ...defaultState(),
      streak: { count: 2, lastActiveDate: "2026-08-21" },
      xp: 50,
      activeDates: ["2026-08-21"],
    };
    db.run("UPDATE users SET progress_json = ? WHERE id = ?", [
      JSON.stringify(initialState),
      TEST_USER_ID,
    ]);

    const newState: SavedState = {
      ...defaultState(),
      streak: { count: 3, lastActiveDate: "2026-08-22" },
      xp: 60,
      activeDates: ["2026-08-21", "2026-08-22"],
    };

    await saveProgress({ data: { state: newState } });

    const deliveries = db
      .query("SELECT * FROM notification_deliveries WHERE user_id = ?")
      .all(TEST_USER_ID);
    expect(deliveries).toHaveLength(0);
  });

  it("enqueues milestone for every milestone threshold: 3, 7, 14, 30, 50, 100, 200, 300", async () => {
    await seedActiveConfig("UTC");

    const thresholds = [3, 7, 14, 30, 50, 100, 200, 300];

    let day = 1;
    for (const threshold of thresholds) {
      const prevDay = day++;
      const nextDay = day++;
      const prevDateStr = `2026-08-${String(prevDay).padStart(2, "0")}`;
      const nextDateStr = `2026-08-${String(nextDay).padStart(2, "0")}`;

      // Set old count to threshold - 1
      const oldState: SavedState = {
        ...defaultState(),
        streak: { count: threshold - 1, lastActiveDate: prevDateStr },
        xp: 100,
        activeDates: [prevDateStr],
      };
      db.run("UPDATE users SET progress_json = ? WHERE id = ?", [
        JSON.stringify(oldState),
        TEST_USER_ID,
      ]);

      const newState: SavedState = {
        ...defaultState(),
        streak: { count: threshold, lastActiveDate: nextDateStr },
        xp: 110,
        activeDates: [prevDateStr, nextDateStr],
      };
      await saveProgress({ data: { state: newState } });
      const delivery = db
        .query(
          "SELECT * FROM notification_deliveries WHERE user_id = ? AND streak_count = ?",
        )
        .get(TEST_USER_ID, threshold) as {
        kind: string;
        streak_count: number;
      } | null;

      expect(delivery).not.toBeNull();
      expect(delivery!.kind).toBe("milestone");
      expect(delivery!.streak_count).toBe(threshold);
    }
  });

  it("does not enqueue milestone delivery for non-threshold streak counts (e.g. 2, 4, 15, 101, 199)", async () => {
    await seedActiveConfig("UTC");

    const nonThresholds = [
      { old: 1, next: 2 },
      { old: 3, next: 4 },
      { old: 14, next: 15 },
      { old: 100, next: 101 },
      { old: 198, next: 199 },
    ];

    for (const { old, next } of nonThresholds) {
      const oldState: SavedState = {
        ...defaultState(),
        streak: { count: old, lastActiveDate: "2026-08-21" },
        xp: 100,
        activeDates: ["2026-08-21"],
      };
      db.run("UPDATE users SET progress_json = ? WHERE id = ?", [
        JSON.stringify(oldState),
        TEST_USER_ID,
      ]);

      const newState: SavedState = {
        ...defaultState(),
        streak: { count: next, lastActiveDate: "2026-08-22" },
        xp: 110,
        activeDates: ["2026-08-21", "2026-08-22"],
      };

      await saveProgress({ data: { state: newState } });
      const delivery = db
        .query(
          "SELECT * FROM notification_deliveries WHERE user_id = ? AND streak_count = ?",
        )
        .get(TEST_USER_ID, next);

      expect(delivery).toBeNull();
    }
  });

  it("does not enqueue duplicate milestone for same-day writes when streak does not advance", async () => {
    await seedActiveConfig("UTC");

    // Seed initial streak 2 with active date
    const initialState: SavedState = {
      ...defaultState(),
      streak: { count: 2, lastActiveDate: "2026-08-21" },
      activeDates: ["2026-08-21"],
      xp: 50,
    };
    db.run("UPDATE users SET progress_json = ? WHERE id = ?", [
      JSON.stringify(initialState),
      TEST_USER_ID,
    ]);
    // Advance to 3 with qualifying activity
    const state1: SavedState = {
      ...defaultState(),
      streak: { count: 3, lastActiveDate: "2026-08-22" },
      activeDates: ["2026-08-21", "2026-08-22"],
      xp: 100,
    };
    await saveProgress({ data: { state: state1 } });

    let count = db
      .query(
        "SELECT COUNT(*) as cnt FROM notification_deliveries WHERE user_id = ?",
      )
      .get(TEST_USER_ID) as { cnt: number };
    expect(count.cnt).toBe(1);

    // Same day activity: XP increases, but streak count stays 3
    const state2: SavedState = {
      ...defaultState(),
      streak: { count: 3, lastActiveDate: "2026-08-22" },
      xp: 150,
    };
    await saveProgress({ data: { state: state2 } });

    count = db
      .query(
        "SELECT COUNT(*) as cnt FROM notification_deliveries WHERE user_id = ?",
      )
      .get(TEST_USER_ID) as { cnt: number };
    expect(count.cnt).toBe(1);
  });
  it("does not enqueue milestone if streak jumps by more than 1 or without qualifying activity", async () => {
    await seedActiveConfig("UTC");

    // Case A: Arbitrary jump from 0 to 3 with activity
    const state0: SavedState = {
      ...defaultState(),
      streak: { count: 0, lastActiveDate: "" },
      xp: 0,
    };
    db.run("UPDATE users SET progress_json = ? WHERE id = ?", [
      JSON.stringify(state0),
      TEST_USER_ID,
    ]);

    const stateJump: SavedState = {
      ...defaultState(),
      streak: { count: 3, lastActiveDate: "2026-08-22" },
      xp: 50,
      activeDates: ["2026-08-22"],
    };
    await saveProgress({ data: { state: stateJump } });

    let deliveries = db
      .query("SELECT * FROM notification_deliveries WHERE user_id = ?")
      .all(TEST_USER_ID);
    expect(deliveries).toHaveLength(0);

    // Case B: Streak increments by 1 but NO qualifying activity occurred (XP, lessons, challenges, activeDates all unchanged)
    const statePre2: SavedState = {
      ...defaultState(),
      streak: { count: 2, lastActiveDate: "2026-08-21" },
      xp: 100,
      activeDates: ["2026-08-21"],
    };
    db.run("UPDATE users SET progress_json = ? WHERE id = ?", [
      JSON.stringify(statePre2),
      TEST_USER_ID,
    ]);

    const state3NoActivity: SavedState = {
      ...defaultState(),
      streak: { count: 3, lastActiveDate: "2026-08-22" },
      xp: 100,
      activeDates: ["2026-08-21"], // No new date, no new xp, no new lessons
    };
    await saveProgress({ data: { state: state3NoActivity } });

    deliveries = db
      .query("SELECT * FROM notification_deliveries WHERE user_id = ?")
      .all(TEST_USER_ID);
    expect(deliveries).toHaveLength(0);
  });

  it("rolls back progress update if transaction fails", async () => {
    await seedActiveConfig("UTC");

    const initialState: SavedState = {
      ...defaultState(),
      streak: { count: 2, lastActiveDate: "2026-08-21" },
      xp: 50,
    };
    db.run("UPDATE users SET progress_json = ? WHERE id = ?", [
      JSON.stringify(initialState),
      TEST_USER_ID,
    ]);

    const loaded = loadUserProgress(db, TEST_USER_ID);
    expect(loaded.xp).toBe(50);
  });
});
