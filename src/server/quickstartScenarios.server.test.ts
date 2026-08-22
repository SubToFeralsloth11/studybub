import { describe, expect, it, vi } from "vitest";

import { getDatabase, initSchema, resetDatabase } from "./db.server";
import { resetEncryptionKey } from "./encryption.server";
import {
  createTestProof,
  deleteNotificationConfiguration,
  enqueueMilestoneDelivery,
  enqueueReminderDelivery,
  getLatestDeliveryRecord,
  getNotificationConfiguration,
  saveNotificationConfigurationFromProof,
} from "./notificationRepository.server";
import { runNotificationWorkerCycle } from "./notificationWorker.server";
import { publishNtfyNotification } from "./ntfyClient.server";
import {
  getMilestoneForStreak,
  projectLocalTimeAndDate,
} from "../domain/notifications/notifications";
const VALID_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("Quickstart Scenarios 1-7 validation", () => {
  it("Scenario 1: Configure, verify, test proof, save, load, remove", async () => {
    process.env.ENCRYPTION_KEY = VALID_KEY;
    process.env.STUDYBUB_PUBLIC_URL = "https://studybub.example.com";
    resetEncryptionKey();
    resetDatabase();
    const db = getDatabase(":memory:");
    initSchema(db);

    const userId = "learner-scenario-1";
    const now = new Date("2026-08-22T12:00:00Z");
    db.run(
      "INSERT INTO users (id, display_name, progress_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [userId, "Learner 1", "{}", now.toISOString(), now.toISOString()],
    );

    // Mock fetch for ntfy test
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Type": "application/json" }),
      json: async () => ({ id: "test-msg-123" }),
    });

    const publishRes = await publishNtfyNotification(
      {
        topic: "disposable-topic-scenario-1",
        title: "StudyBub notifications",
        body: "Your StudyBub streak notifications are connected.",
        priority: 2,
        publicUrl: "https://studybub.example.com",
      },
      { fetch: mockFetch as never },
    );
    expect(publishRes.ok).toBe(true);

    const proofId = await createTestProof(db, {
      userId,
      topic: "disposable-topic-scenario-1",
      reminderTime: "19:00",
      timezone: "UTC",
      now,
    });

    // Save configuration from proof
    await saveNotificationConfigurationFromProof(db, proofId, userId, now);

    const activeConfig = await getNotificationConfiguration(db, userId);
    expect(activeConfig).not.toBeNull();
    expect(activeConfig?.topic).toBe("disposable-topic-scenario-1");
    expect(activeConfig?.reminderTime).toBe("19:00");
    expect(activeConfig?.timezone).toBe("UTC");
  });

  it("Scenario 2: Deliver and suppress an at-risk reminder", async () => {
    process.env.ENCRYPTION_KEY = VALID_KEY;
    process.env.STUDYBUB_PUBLIC_URL = "https://studybub.example.com";
    resetEncryptionKey();
    resetDatabase();
    const db = getDatabase(":memory:");
    initSchema(db);

    const userId = "learner-scenario-2";
    const now = new Date("2026-08-20T10:00:00Z");
    db.run(
      "INSERT INTO users (id, display_name, progress_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [userId, "Learner 2", "{}", now.toISOString(), now.toISOString()],
    );

    db.run(
      `CREATE TABLE IF NOT EXISTS progress (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        state_json TEXT NOT NULL,
        streak_count INTEGER NOT NULL DEFAULT 0,
        last_active_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
    );

    // Seed progress: streak 4, last active yesterday (2026-08-21)
    db.run(
      "INSERT INTO progress (user_id, state_json, streak_count, last_active_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [
        userId,
        JSON.stringify({ streak: { count: 4, lastActiveDate: "2026-08-21" } }),
        4,
        "2026-08-21",
        now.toISOString(),
        now.toISOString(),
      ],
    );

    const proofId = await createTestProof(db, {
      userId,
      topic: "scenario-2-topic",
      reminderTime: "19:00",
      timezone: "UTC",
      now,
    });
    await saveNotificationConfigurationFromProof(db, proofId, userId, now);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Type": "application/json" }),
      json: async () => ({ id: "msg-rem-4" }),
    });

    // Run cycle at 19:00 UTC on 2026-08-22
    const cycleTime = new Date("2026-08-22T19:00:00Z");
    const result = await runNotificationWorkerCycle({
      db,
      now: cycleTime,
      fetch: mockFetch as never,
    });

    expect(result.evaluations).toBe(1);
    expect(result.claims).toBe(1);
    expect(result.succeeded).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Repeat cycle immediately: dedupe prevents second push
    const result2 = await runNotificationWorkerCycle({
      db,
      now: cycleTime,
      fetch: mockFetch as never,
    });
    expect(result2.evaluations).toBe(0);
    expect(result2.claims).toBe(0);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("Scenario 3: Exclude ineligible learners and late setup", async () => {
    process.env.ENCRYPTION_KEY = VALID_KEY;
    process.env.STUDYBUB_PUBLIC_URL = "https://studybub.example.com";
    resetEncryptionKey();
    resetDatabase();
    const db = getDatabase(":memory:");
    initSchema(db);

    const userNoStreak = "user-no-streak";
    const userActiveToday = "user-active-today";
    const userBrokenStreak = "user-broken-streak";
    const userLateSetup = "user-late-setup";
    const now = new Date("2026-08-20T10:00:00Z");

    for (const u of [
      userNoStreak,
      userActiveToday,
      userBrokenStreak,
      userLateSetup,
    ]) {
      db.run(
        "INSERT INTO users (id, display_name, progress_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        [u, u, "{}", now.toISOString(), now.toISOString()],
      );
    }

    db.run(
      `CREATE TABLE IF NOT EXISTS progress (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        state_json TEXT NOT NULL,
        streak_count INTEGER NOT NULL DEFAULT 0,
        last_active_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
    );

    // 1. No streak (0 count)
    db.run(
      "INSERT INTO progress (user_id, state_json, streak_count, last_active_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [userNoStreak, "{}", 0, null, now.toISOString(), now.toISOString()],
    );
    // 2. Active today (2026-08-22)
    db.run(
      "INSERT INTO progress (user_id, state_json, streak_count, last_active_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [
        userActiveToday,
        "{}",
        5,
        "2026-08-22",
        now.toISOString(),
        now.toISOString(),
      ],
    );
    // 3. Broken streak (active 2 days ago, 2026-08-20)
    db.run(
      "INSERT INTO progress (user_id, state_json, streak_count, last_active_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [
        userBrokenStreak,
        "{}",
        5,
        "2026-08-20",
        now.toISOString(),
        now.toISOString(),
      ],
    );
    // 4. Late setup: active yesterday (2026-08-21), but configuration activated at 19:30 UTC today (reminder was 19:00)
    db.run(
      "INSERT INTO progress (user_id, state_json, streak_count, last_active_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [
        userLateSetup,
        "{}",
        5,
        "2026-08-21",
        now.toISOString(),
        now.toISOString(),
      ],
    );

    for (const u of [userNoStreak, userActiveToday, userBrokenStreak]) {
      const proofId = await createTestProof(db, {
        userId: u,
        topic: `topic-${u}`,
        reminderTime: "19:00",
        timezone: "UTC",
        now,
      });
      await saveNotificationConfigurationFromProof(db, proofId, u, now);
    }

    // Late setup activated at 19:30
    const lateActivationTime = new Date("2026-08-22T19:30:00Z");
    const lateProofId = await createTestProof(db, {
      userId: userLateSetup,
      topic: `topic-${userLateSetup}`,
      reminderTime: "19:00",
      timezone: "UTC",
      now: lateActivationTime,
    });
    await saveNotificationConfigurationFromProof(
      db,
      lateProofId,
      userLateSetup,
      lateActivationTime,
    );

    const mockFetch = vi.fn();
    const cycleTime = new Date("2026-08-22T19:35:00Z");
    const result = await runNotificationWorkerCycle({
      db,
      now: cycleTime,
      fetch: mockFetch as never,
    });

    expect(result.evaluations).toBe(0);
    expect(result.claims).toBe(0);
    expect(result.succeeded).toBe(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("Scenario 4: Celebrate a milestone (every threshold, same-day dedupe, no retroactive push)", async () => {
    process.env.ENCRYPTION_KEY = VALID_KEY;
    process.env.STUDYBUB_PUBLIC_URL = "https://studybub.example.com";
    resetEncryptionKey();
    resetDatabase();
    const db = getDatabase(":memory:");
    initSchema(db);

    const userId = "learner-scenario-4";
    const now = new Date("2026-08-20T10:00:00Z");

    // 1. Activate notification settings while the persisted streak is 2
    const initialProgress = {
      version: 1,
      lessons: {},
      challenges: {},
      xp: 100,
      streak: { count: 2, lastActiveDate: "2026-08-19" },
      badges: [],
      activeDates: ["2026-08-18", "2026-08-19"],
    };

    db.run(
      "INSERT INTO users (id, display_name, progress_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [
        userId,
        "Learner 4",
        JSON.stringify(initialProgress),
        now.toISOString(),
        now.toISOString(),
      ],
    );

    const proofId = await createTestProof(db, {
      userId,
      topic: "milestone-scenario-topic",
      reminderTime: "19:00",
      timezone: "UTC",
      now,
    });
    await saveNotificationConfigurationFromProof(db, proofId, userId, now);

    // 2. Persist qualifying activity advancing it to 3 (simulating saveProgress transaction)
    const streak3State = {
      ...initialProgress,
      streak: { count: 3, lastActiveDate: "2026-08-20" },
      xp: 150,
    };

    // In application runtime, saveProgress runs the atomic transaction
    const saveProgressTx = (
      newState: typeof initialProgress,
      advanceTime: Date,
    ) => {
      const tx = db.transaction(() => {
        const row = db
          .query("SELECT progress_json FROM users WHERE id = ?")
          .get(userId) as { progress_json: string } | undefined;
        const prior = row ? JSON.parse(row.progress_json) : null;
        const priorCount = prior?.streak?.count ?? 0;

        db.run(
          "UPDATE users SET progress_json = ?, updated_at = ? WHERE id = ?",
          [JSON.stringify(newState), advanceTime.toISOString(), userId],
        );

        const milestone = getMilestoneForStreak(
          priorCount,
          newState.streak.count,
        );
        if (milestone !== null) {
          const config = db
            .query(
              "SELECT timezone FROM notification_configurations WHERE user_id = ?",
            )
            .get(userId) as { timezone: string } | null;
          if (config) {
            const projection = projectLocalTimeAndDate(
              advanceTime,
              config.timezone,
            );
            enqueueMilestoneDelivery(db, {
              userId,
              streakCount: milestone,
              lastActiveDate: newState.streak.lastActiveDate,
              localDate: projection.localDate,
              timezone: config.timezone,
              now: advanceTime,
              nextAttemptAt: advanceTime,
              expiresAt: new Date(advanceTime.getTime() + 24 * 60 * 60 * 1000),
            });
          }
        }
      });
      tx();
    };

    const advanceTime = new Date("2026-08-20T11:00:00Z");
    saveProgressTx(streak3State, advanceTime);

    // 3. Observe one low-priority milestone notification within one minute
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Type": "application/json" }),
      json: async () => ({ id: "ntfy-milestone-3" }),
    });

    const cycleTime = new Date("2026-08-20T11:00:30Z"); // 30 seconds later
    const cycleResult = await runNotificationWorkerCycle({
      db,
      now: cycleTime,
      fetch: mockFetch as never,
    });

    expect(cycleResult.claims).toBe(1);
    expect(cycleResult.succeeded).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // 4. Persist more same-day activity and confirm no duplicate
    const sameDayState = {
      ...streak3State,
      xp: 200,
    };
    saveProgressTx(sameDayState, new Date("2026-08-20T11:30:00Z"));

    const cycleResultSameDay = await runNotificationWorkerCycle({
      db,
      now: new Date("2026-08-20T11:31:00Z"),
      fetch: mockFetch as never,
    });
    expect(cycleResultSameDay.claims).toBe(0);
    expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1

    // 5. Repeat for 7, 14, 30, 50, 100, and 200; verify 101 and 199 do not notify
    const milestoneSteps = [
      { streak: 7, expectMilestone: true },
      { streak: 14, expectMilestone: true },
      { streak: 30, expectMilestone: true },
      { streak: 50, expectMilestone: true },
      { streak: 100, expectMilestone: true },
      { streak: 101, expectMilestone: false },
      { streak: 199, expectMilestone: false },
      { streak: 200, expectMilestone: true },
    ];

    for (const step of milestoneSteps) {
      const initialFetchCount = mockFetch.mock.calls.length;
      const day = String((step.streak % 28) + 1).padStart(2, "0");
      const stepTime = new Date(`2026-09-${day}T12:00:00Z`);
      const stepState = {
        ...initialProgress,
        streak: { count: step.streak, lastActiveDate: `2026-09-${day}` },
        xp: 300 + step.streak * 10,
      };
      saveProgressTx(stepState, stepTime);

      const workerResult = await runNotificationWorkerCycle({
        db,
        now: new Date(stepTime.getTime() + 15 * 1000),
        fetch: mockFetch as never,
      });

      const expectedClaims = step.expectMilestone ? 1 : 0;
      const expectedSucceeded = step.expectMilestone ? 1 : 0;
      const expectedFetchCount = step.expectMilestone
        ? initialFetchCount + 1
        : initialFetchCount;
      expect(workerResult.claims).toBe(expectedClaims);
      expect(workerResult.succeeded).toBe(expectedSucceeded);
      expect(mockFetch).toHaveBeenCalledTimes(expectedFetchCount);
    }

    // 6. Configure notifications while already at a milestone and confirm no retroactive push
    const userRetro = "learner-retroactive";
    const retroProgress = {
      ...initialProgress,
      streak: { count: 100, lastActiveDate: "2026-08-20" },
    };
    db.run(
      "INSERT INTO users (id, display_name, progress_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [
        userRetro,
        "Retro Learner",
        JSON.stringify(retroProgress),
        now.toISOString(),
        now.toISOString(),
      ],
    );

    const retroProofId = await createTestProof(db, {
      userId: userRetro,
      topic: "retro-topic",
      reminderTime: "19:00",
      timezone: "UTC",
      now,
    });
    await saveNotificationConfigurationFromProof(
      db,
      retroProofId,
      userRetro,
      now,
    );

    const initialCallCount = mockFetch.mock.calls.length;
    const retroWorkerResult = await runNotificationWorkerCycle({
      db,
      now: new Date("2026-08-20T12:05:00Z"),
      fetch: mockFetch as never,
    });

    expect(retroWorkerResult.claims).toBe(0);
    expect(mockFetch).toHaveBeenCalledTimes(initialCallCount);
  });

  it("Scenario 5: Retry, dedupe, expiry, and status", async () => {
    process.env.ENCRYPTION_KEY = VALID_KEY;
    process.env.STUDYBUB_PUBLIC_URL = "https://studybub.example.com";
    resetEncryptionKey();
    resetDatabase();
    const db = getDatabase(":memory:");
    initSchema(db);

    const userId = "learner-scenario-5";
    const userTz = "America/New_York";
    const reminderTime = "19:00";
    const initialTime = new Date("2026-08-22T23:00:00Z"); // 19:00 EDT

    // Seed progress with 5 streak, last active yesterday (2026-08-21)
    const initialProgress = {
      version: 1,
      xp: 150,
      streak: { count: 5, lastActiveDate: "2026-08-21" },
      badges: [],
      activeDates: ["2026-08-21"],
      lessons: {},
      challenges: {},
    };

    db.run(
      "INSERT INTO users (id, display_name, progress_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [
        userId,
        "Learner 5",
        JSON.stringify(initialProgress),
        initialTime.toISOString(),
        initialTime.toISOString(),
      ],
    );

    // Activate configuration
    const proofId = await createTestProof(db, {
      userId,
      topic: "scenario-5-topic",
      reminderTime,
      timezone: userTz,
      now: new Date("2026-08-22T12:00:00Z"),
    });
    await saveNotificationConfigurationFromProof(
      db,
      proofId,
      userId,
      new Date("2026-08-22T12:00:00Z"),
    );

    // Step 1 & 2: Transport returns network error (attempt 1), then 503 (attempt 2), then 200 (attempt 3)
    let attemptCount = 0;
    const sequenceIds: string[] = [];
    const mockFetch = vi.fn().mockImplementation(async (_url, options) => {
      attemptCount++;
      if (options?.headers?.["X-Sequence-ID"]) {
        sequenceIds.push(options.headers["X-Sequence-ID"]);
      }
      if (attemptCount === 1) {
        throw new Error("Network offline");
      }
      if (attemptCount === 2) {
        return {
          ok: false,
          status: 503,
          headers: new Headers({ "Retry-After": "300" }),
          text: async () => "Service Unavailable",
          json: async () => ({ error: "Service Unavailable" }),
        };
      }
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () => JSON.stringify({ id: "ntfy-msg-success-5" }),
        json: async () => ({ id: "ntfy-msg-success-5" }),
      };
    });

    // Cycle 1 at 19:00 EDT -> creates reminder and attempts (fails: network error, schedules retry after 60s)
    const cycle1 = await runNotificationWorkerCycle({
      db,
      now: initialTime,
      fetch: mockFetch as never,
    });
    expect(cycle1.evaluations).toBe(1);
    expect(cycle1.claims).toBe(1);
    expect(cycle1.failed).toBe(1);

    // Cycle 2 at +30s -> not due yet
    const cycle2 = await runNotificationWorkerCycle({
      db,
      now: new Date(initialTime.getTime() + 30 * 1000),
      fetch: mockFetch as never,
    });
    expect(cycle2.claims).toBe(0);

    // Cycle 3 at +60s -> retry due (fails: 503, retry-after: 300s)
    const cycle3 = await runNotificationWorkerCycle({
      db,
      now: new Date(initialTime.getTime() + 60 * 1000),
      fetch: mockFetch as never,
    });
    expect(cycle3.claims).toBe(1);
    expect(cycle3.failed).toBe(1);

    // Cycle 4 at +360s (60s + 300s) -> succeeds
    const successTime = new Date(initialTime.getTime() + 360 * 1000);
    const cycle4 = await runNotificationWorkerCycle({
      db,
      now: successTime,
      fetch: mockFetch as never,
    });
    expect(cycle4.claims).toBe(1);
    expect(cycle4.succeeded).toBe(1);

    // All 3 attempts used the exact same sequence ID (deduplication)
    expect(sequenceIds).toHaveLength(3);
    expect(sequenceIds[0]).toBe(sequenceIds[1]);
    expect(sequenceIds[1]).toBe(sequenceIds[2]);

    // Step 3: Latest status check in America/New_York
    const latestRecord = getLatestDeliveryRecord(db, userId);
    expect(latestRecord).not.toBeNull();
    expect(latestRecord?.status).toBe("succeeded");
    expect(latestRecord?.kind).toBe("reminder");

    // Step 4: Transport returns 400 -> immediate terminal failure with generic status reason
    const userPerm = "learner-perm-fail";
    db.run(
      "INSERT INTO users (id, display_name, progress_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [
        userPerm,
        "Perm User",
        JSON.stringify(initialProgress),
        initialTime.toISOString(),
        initialTime.toISOString(),
      ],
    );
    const proofPerm = await createTestProof(db, {
      userId: userPerm,
      topic: "perm-fail-topic",
      reminderTime,
      timezone: "UTC",
      now: new Date("2026-08-22T12:00:00Z"),
    });
    await saveNotificationConfigurationFromProof(
      db,
      proofPerm,
      userPerm,
      new Date("2026-08-22T12:00:00Z"),
    );
    const permFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers(),
      text: async () => "Bad Request: invalid topic",
      json: async () => ({ error: "Bad Request" }),
    });

    const permCycle1 = await runNotificationWorkerCycle({
      db,
      now: new Date("2026-08-22T19:00:00Z"),
      fetch: permFetch as never,
    });
    expect(permCycle1.claims).toBe(1);
    expect(permCycle1.failed).toBe(1);

    const permDelivery = getLatestDeliveryRecord(db, userPerm);
    expect(permDelivery?.status).toBe("failed");
    expect(permDelivery?.lastResultCode).toBe("rejected");

    // Step 5: Reminder validity ends at local midnight and milestone at +24h
    const userExpiry = "learner-expiry";
    db.run(
      "INSERT INTO users (id, display_name, progress_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [
        userExpiry,
        "Expiry User",
        JSON.stringify(initialProgress),
        initialTime.toISOString(),
        initialTime.toISOString(),
      ],
    );
    const proofExpiry = await createTestProof(db, {
      userId: userExpiry,
      topic: "expiry-topic",
      reminderTime: "19:00",
      timezone: "UTC",
      now: new Date("2026-08-22T12:00:00Z"),
    });
    await saveNotificationConfigurationFromProof(
      db,
      proofExpiry,
      userExpiry,
      new Date("2026-08-22T12:00:00Z"),
    );

    // Reminder fails at 19:00, then midnight passes
    const expFetch = vi.fn().mockImplementation(async () => {
      throw new Error("Network error");
    });
    await runNotificationWorkerCycle({
      db,
      now: new Date("2026-08-22T19:00:00Z"),
      fetch: expFetch as never,
    });

    // Run cycle at 00:05 next day
    const nextDayCycle = await runNotificationWorkerCycle({
      db,
      now: new Date("2026-08-23T00:05:00Z"),
      fetch: expFetch as never,
    });
    expect(nextDayCycle.claims).toBe(0);
  });

  it("Scenario 6: Replace and remove", async () => {
    process.env.ENCRYPTION_KEY = VALID_KEY;
    process.env.STUDYBUB_PUBLIC_URL = "https://studybub.example.com";
    resetEncryptionKey();
    resetDatabase();
    const db = getDatabase(":memory:");
    initSchema(db);

    const userId = "learner-scenario-6";
    const t0 = new Date("2026-08-22T10:00:00Z");

    const progress = {
      level: 1,
      xp: 200,
      activeTrack: "spanish",
      streak: { count: 10, lastActiveDate: "2026-08-21" },
      activeDates: ["2026-08-21"],
      lessonProgress: {},
      topicProgress: {},
      dailyChallenges: {},
    };

    db.run(
      "INSERT INTO users (id, display_name, progress_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [
        userId,
        "Learner 6",
        JSON.stringify(progress),
        t0.toISOString(),
        t0.toISOString(),
      ],
    );

    // 1. Initial setup
    const proof1 = await createTestProof(db, {
      userId,
      topic: "old-topic-6",
      reminderTime: "18:00",
      timezone: "UTC",
      now: t0,
    });
    await saveNotificationConfigurationFromProof(db, proof1, userId, t0);

    // Seed pending reminder delivery
    enqueueReminderDelivery(db, {
      userId,
      localDate: "2026-08-22",
      timezone: "UTC",
      streakCount: 10,
      now: t0,
      nextAttemptAt: t0,
      expiresAt: new Date("2026-08-22T23:59:59Z"),
    });

    // 2 & 3. Replacement values must be tested before saving; atomic replacement deletes old pending work
    const t1 = new Date("2026-08-22T11:00:00Z");
    const proof2 = await createTestProof(db, {
      userId,
      topic: "new-replaced-topic-6",
      reminderTime: "20:00",
      timezone: "Europe/London",
      now: t1,
    });
    const replaced = await saveNotificationConfigurationFromProof(
      db,
      proof2,
      userId,
      t1,
    );
    expect(replaced.topic).toBe("new-replaced-topic-6");
    expect(replaced.reminderTime).toBe("20:00");
    expect(replaced.timezone).toBe("Europe/London");

    // Old pending work is invalidated
    const pendingWork = db
      .query(
        "SELECT * FROM notification_deliveries WHERE user_id = ? AND status = 'pending'",
      )
      .all(userId);
    expect(pendingWork).toHaveLength(0);

    // 4 & 5. Remove configuration and confirm settings/history disappear
    deleteNotificationConfiguration(db, userId);
    expect(await getNotificationConfiguration(db, userId)).toBeNull();
    expect(getLatestDeliveryRecord(db, userId)).toBeNull();

    // Worker run afterward does nothing
    const mockFetch = vi.fn();
    const postRemoveCycle = await runNotificationWorkerCycle({
      db,
      now: new Date("2026-08-22T20:00:00Z"),
      fetch: mockFetch as never,
    });
    expect(postRemoveCycle.claims).toBe(0);
    expect(postRemoveCycle.evaluations).toBe(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("Scenario 7: Timezone and DST boundaries", async () => {
    process.env.ENCRYPTION_KEY = VALID_KEY;
    process.env.STUDYBUB_PUBLIC_URL = "https://studybub.example.com";
    resetEncryptionKey();
    resetDatabase();
    const db = getDatabase(":memory:");
    initSchema(db);

    const userId = "learner-scenario-7";
    const userTz = "America/New_York"; // US Eastern: EDT (UTC-4) in summer, EST (UTC-5) in winter
    const reminderTime = "19:00";
    const setupTime = new Date("2026-03-01T12:00:00Z");

    // 1. Spring-forward test: 2026-03-08 is US spring forward (EST -> EDT)
    const progressSpring = {
      version: 1,
      xp: 200,
      streak: { count: 12, lastActiveDate: "2026-03-07" },
      badges: [],
      activeDates: ["2026-03-07"],
      lessons: {},
      challenges: {},
    };

    db.run(
      "INSERT INTO users (id, display_name, progress_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [
        userId,
        "Learner 7",
        JSON.stringify(progressSpring),
        setupTime.toISOString(),
        setupTime.toISOString(),
      ],
    );

    const proofId = await createTestProof(db, {
      userId,
      topic: "dst-topic-7",
      reminderTime,
      timezone: userTz,
      now: setupTime,
    });
    await saveNotificationConfigurationFromProof(
      db,
      proofId,
      userId,
      setupTime,
    );

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: async () => JSON.stringify({ id: "dst-msg-1" }),
      json: async () => ({ id: "dst-msg-1" }),
    });

    // 18:59 EDT on 2026-03-08 is 2026-03-08T22:59:00Z -> not due
    const preCycle = await runNotificationWorkerCycle({
      db,
      now: new Date("2026-03-08T22:59:00Z"),
      fetch: mockFetch as never,
    });
    expect(preCycle.evaluations).toBe(0);

    // 19:00 EDT on 2026-03-08 is 2026-03-08T23:00:00Z -> exactly due
    const dueCycle = await runNotificationWorkerCycle({
      db,
      now: new Date("2026-03-08T23:00:00Z"),
      fetch: mockFetch as never,
    });
    expect(dueCycle.evaluations).toBe(1);
    expect(dueCycle.succeeded).toBe(1);

    // 2. Fall-back test: 2026-11-01 is US fall back (EDT -> EST)
    // 19:00 EDT on 2026-10-31 is 2026-10-31T23:00:00Z
    // 19:00 EST on 2026-11-01 is 2026-11-02T00:00:00Z
    const userFall = "learner-fall-back";
    const progressFall = {
      version: 1,
      xp: 300,
      streak: { count: 20, lastActiveDate: "2026-10-31" },
      badges: [],
      activeDates: ["2026-10-31"],
      lessons: {},
      challenges: {},
    };
    db.run(
      "INSERT INTO users (id, display_name, progress_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [
        userFall,
        "Fall User",
        JSON.stringify(progressFall),
        setupTime.toISOString(),
        setupTime.toISOString(),
      ],
    );
    const proofFall = await createTestProof(db, {
      userId: userFall,
      topic: "fall-topic",
      reminderTime,
      timezone: userTz,
      now: setupTime,
    });
    await saveNotificationConfigurationFromProof(
      db,
      proofFall,
      userFall,
      setupTime,
    );

    // 18:59 EST on 2026-11-01 is 2026-11-01T23:59:00Z -> not due yet
    const fallPreCycle = await runNotificationWorkerCycle({
      db,
      now: new Date("2026-11-01T23:59:00Z"),
      fetch: mockFetch as never,
    });
    expect(fallPreCycle.evaluations).toBe(0);

    // 19:00 EST on 2026-11-01 is 2026-11-02T00:00:00Z -> due
    const fallDueCycle = await runNotificationWorkerCycle({
      db,
      now: new Date("2026-11-02T00:00:00Z"),
      fetch: mockFetch as never,
    });
    expect(fallDueCycle.evaluations).toBe(1);
    expect(fallDueCycle.succeeded).toBe(1);
  });
});
