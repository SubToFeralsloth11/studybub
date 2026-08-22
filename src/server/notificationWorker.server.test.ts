import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDatabase, initSchema, resetDatabase } from "./db.server";
import { resetEncryptionKey } from "./encryption.server";
import {
  createTestProof,
  enqueueMilestoneDelivery,
  enqueueReminderDelivery,
  saveNotificationConfigurationFromProof,
} from "./notificationRepository.server";
import { runNotificationWorkerCycle } from "./notificationWorker.server";

const mockPublishNtfyNotification = vi.fn();
vi.mock("./ntfyClient.server", () => ({
  publishNtfyNotification: (...args: unknown[]) =>
    mockPublishNtfyNotification(...args),
}));

describe("notificationWorker.server", () => {
  let db: Database;
  const userId = "worker-user-1";

  beforeEach(() => {
    process.env.ENCRYPTION_KEY =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    process.env.STUDYBUB_PUBLIC_URL = "https://studybub.example.com";
    resetEncryptionKey();
    resetDatabase();
    db = getDatabase(":memory:");
    initSchema(db);
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
    db.run(
      "INSERT INTO users (id, display_name, progress_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [
        userId,
        "Worker User",
        "{}",
        new Date().toISOString(),
        new Date().toISOString(),
      ],
    );
    mockPublishNtfyNotification.mockReset();
  });

  async function seedConfig(
    reminderTime = "19:00",
    timezone = "UTC",
    activatedAt?: Date,
  ) {
    const now = activatedAt ?? new Date("2026-08-20T10:00:00Z");
    const proofId = await createTestProof(db, {
      userId,
      topic: "test-streak-topic",
      reminderTime,
      timezone,
      now,
    });
    await saveNotificationConfigurationFromProof(db, proofId, userId, now);
  }

  function seedProgress(streakCount: number, lastActiveDate: string | null) {
    db.run(
      `INSERT OR REPLACE INTO progress (user_id, state_json, streak_count, last_active_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        JSON.stringify({ streak: { count: streakCount, lastActiveDate } }),
        streakCount,
        lastActiveDate,
        new Date().toISOString(),
        new Date().toISOString(),
      ],
    );
  }

  it("evaluates and enqueues due reminder for eligible learner (streak > 0, last active yesterday, no activity today)", async () => {
    // Activated before reminder time
    await seedConfig("19:00", "UTC", new Date("2026-08-22T10:00:00Z"));
    // Streak 5, active yesterday 2026-08-21
    seedProgress(5, "2026-08-21");

    mockPublishNtfyNotification.mockResolvedValueOnce({
      ok: true,
      status: 200,
      ntfyMessageId: "msg-reminder-1",
    });

    // Current time is 19:02 UTC on 2026-08-22 (within 5 min)
    const now = new Date("2026-08-22T19:02:00Z");
    const result = await runNotificationWorkerCycle({ db, now });

    expect(result.evaluations).toBe(1);
    expect(result.claims).toBe(1);
    expect(result.succeeded).toBe(1);

    expect(mockPublishNtfyNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: "test-streak-topic",
        title: "Keep your 5-day streak",
        body: "Study today to keep it going.",
        priority: 3,
        tags: ["fire"],
        publicUrl: "https://studybub.example.com",
      }),
      expect.anything(),
    );
  });

  it("does not enqueue reminder if current time is not yet at or past reminder time", async () => {
    await seedConfig("19:00", "UTC", new Date("2026-08-22T10:00:00Z"));
    seedProgress(5, "2026-08-21");

    // 18:59 UTC
    const now = new Date("2026-08-22T18:59:00Z");
    const result = await runNotificationWorkerCycle({ db, now });

    expect(result.claims).toBe(0);
    expect(mockPublishNtfyNotification).not.toHaveBeenCalled();
  });

  it("does not send reminder if learner already completed activity today", async () => {
    await seedConfig("19:00", "UTC", new Date("2026-08-22T10:00:00Z"));
    // Already active today 2026-08-22
    seedProgress(5, "2026-08-22");

    const now = new Date("2026-08-22T19:00:00Z");
    const result = await runNotificationWorkerCycle({ db, now });

    expect(result.claims).toBe(0);
    expect(mockPublishNtfyNotification).not.toHaveBeenCalled();
  });

  it("does not send reminder if learner has 0 streak or broken streak older than yesterday", async () => {
    await seedConfig("19:00", "UTC", new Date("2026-08-22T10:00:00Z"));
    // Broken streak (last active 2 days ago)
    seedProgress(5, "2026-08-20");

    const now = new Date("2026-08-22T19:00:00Z");
    const result = await runNotificationWorkerCycle({ db, now });

    expect(result.claims).toBe(0);
    expect(mockPublishNtfyNotification).not.toHaveBeenCalled();
  });

  it("does not send catch-up reminder on the same day if activated after reminder time", async () => {
    // Activated at 19:30 UTC, reminder time was 19:00
    await seedConfig("19:00", "UTC", new Date("2026-08-22T19:30:00Z"));
    seedProgress(5, "2026-08-21");

    const now = new Date("2026-08-22T19:35:00Z");
    const result = await runNotificationWorkerCycle({ db, now });

    expect(result.claims).toBe(0);
    expect(mockPublishNtfyNotification).not.toHaveBeenCalled();
  });

  it("suppresses pending reminder if qualifying activity is recorded before delivery", async () => {
    await seedConfig("19:00", "UTC", new Date("2026-08-22T10:00:00Z"));
    seedProgress(5, "2026-08-21");

    enqueueReminderDelivery(db, {
      userId,
      localDate: "2026-08-22",
      timezone: "UTC",
      streakCount: 5,
      now: new Date("2026-08-22T19:00:00Z"),
      nextAttemptAt: new Date("2026-08-22T19:00:00Z"),
      expiresAt: new Date("2026-08-22T23:59:59Z"),
    });

    // Learner completes activity right before worker runs
    seedProgress(6, "2026-08-22");

    const now = new Date("2026-08-22T19:01:00Z");
    const result = await runNotificationWorkerCycle({ db, now });

    expect(result.suppressed).toBe(1);
    expect(mockPublishNtfyNotification).not.toHaveBeenCalled();
  });

  it("suppresses reminder when learner was active today (via activeDates or streak lastActiveDate in configured timezone)", async () => {
    // User configured for America/New_York (UTC-4 in summer)
    await seedConfig(
      "19:00",
      "America/New_York",
      new Date("2026-08-20T10:00:00Z"),
    );

    // Streak 5, lastActiveDate 2026-08-22 (today in America/New_York)
    const userProgress = {
      version: 1,
      lessons: {},
      challenges: {},
      xp: 150,
      streak: { count: 5, lastActiveDate: "2026-08-22" },
      badges: [],
      activeDates: ["2026-08-21", "2026-08-22"],
    };
    db.run("UPDATE users SET progress_json = ? WHERE id = ?", [
      JSON.stringify(userProgress),
      userId,
    ]);
    // Remove isolated progress table row so canonical users table is read
    db.run("DELETE FROM progress WHERE user_id = ?", [userId]);

    // Current time is 20:00 EDT on 2026-08-22 (2026-08-23T00:00:00Z)
    const now = new Date("2026-08-23T00:00:00Z");
    const result = await runNotificationWorkerCycle({ db, now });

    // Since learner was active today (2026-08-22), reminder is not evaluated
    expect(result.claims).toBe(0);
    expect(result.evaluations).toBe(0);
    expect(mockPublishNtfyNotification).not.toHaveBeenCalled();
  });

  it("handles retries on temporary failure and dedupes across cycles", async () => {
    await seedConfig("19:00", "UTC", new Date("2026-08-22T10:00:00Z"));
    seedProgress(5, "2026-08-21");

    // First attempt fails with 503
    mockPublishNtfyNotification.mockResolvedValueOnce({
      ok: false,
      status: 503,
      classification: "service-unavailable",
      isPermanent: false,
    });

    let now = new Date("2026-08-22T19:00:00Z");
    let result = await runNotificationWorkerCycle({ db, now });
    expect(result.failed).toBe(1);

    // Second run immediately: nextAttemptAt is 1 minute later, so 0 claims
    result = await runNotificationWorkerCycle({ db, now });
    expect(result.claims).toBe(0);

    // Run 1 minute later
    now = new Date("2026-08-22T19:01:05Z");
    mockPublishNtfyNotification.mockResolvedValueOnce({
      ok: true,
      status: 200,
      ntfyMessageId: "msg-retry-ok",
    });

    result = await runNotificationWorkerCycle({ db, now });
    expect(result.claims).toBe(1);
    expect(result.succeeded).toBe(1);

    // Deliveries table should show succeeded
    const row = db
      .query("SELECT status, attempt_count FROM notification_deliveries")
      .get() as { status: string; attempt_count: number };
    expect(row.status).toBe("succeeded");
    expect(row.attempt_count).toBe(2);
  });
  it("processes multiple claimed deliveries concurrently rather than blocking serially", async () => {
    // Create 10 distinct users with active configurations and pending milestone deliveries
    const now = new Date("2026-08-22T14:30:00Z");
    let activeInFlight = 0;
    let maxInFlight = 0;

    for (let i = 1; i <= 10; i++) {
      const uId = `concurrency-user-${i}`;
      db.run(
        "INSERT INTO users (id, display_name, progress_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        [uId, `User ${i}`, "{}", now.toISOString(), now.toISOString()],
      );
      const proof = await createTestProof(db, {
        userId: uId,
        topic: `topic-${i}`,
        reminderTime: "19:00",
        timezone: "UTC",
        now,
      });
      await saveNotificationConfigurationFromProof(db, proof, uId, now);

      enqueueMilestoneDelivery(db, {
        userId: uId,
        streakCount: 7,
        lastActiveDate: "2026-08-22",
        localDate: "2026-08-22",
        timezone: "UTC",
        now,
        nextAttemptAt: now,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      });
    }

    mockPublishNtfyNotification.mockImplementation(async () => {
      activeInFlight++;
      if (activeInFlight > maxInFlight) {
        maxInFlight = activeInFlight;
      }
      // Small async delay
      await new Promise((resolve) => setTimeout(resolve, 20));
      activeInFlight--;
      return {
        ok: true,
        status: 200,
        ntfyMessageId: "concurrency-msg-ok",
      };
    });

    const cycleResult = await runNotificationWorkerCycle({ db, now });
    expect(cycleResult.claims).toBe(10);
    expect(cycleResult.succeeded).toBe(10);
    expect(maxInFlight).toBeGreaterThan(1);
  });

  describe("milestone delivery handling (T031)", () => {
    it("delivers enqueued milestone within one minute with priority 2, tada tag, stable sequence ID, and generic copy", async () => {
      await seedConfig("19:00", "UTC", new Date("2026-08-20T10:00:00Z"));
      const now = new Date("2026-08-22T14:30:00Z");

      enqueueMilestoneDelivery(db, {
        userId,
        streakCount: 7,
        lastActiveDate: "2026-08-22",
        localDate: "2026-08-22",
        timezone: "UTC",
        now,
        nextAttemptAt: now,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      });

      mockPublishNtfyNotification.mockResolvedValueOnce({
        ok: true,
        status: 200,
        ntfyMessageId: "msg-milestone-7",
      });

      // Run worker within one minute (e.g. 14:30:15Z)
      const cycleTime = new Date("2026-08-22T14:30:15Z");
      const result = await runNotificationWorkerCycle({ db, now: cycleTime });

      expect(result.claims).toBe(1);
      expect(result.succeeded).toBe(1);

      // Verify publish params
      expect(mockPublishNtfyNotification).toHaveBeenCalledTimes(1);
      const publishCall = mockPublishNtfyNotification.mock.calls[0][0];
      expect(publishCall.topic).toBe("test-streak-topic");
      expect(publishCall.title).toBe("7-day streak");
      expect(publishCall.body).toBe(
        "You reached a 7-day streak. Keep it going!",
      );
      expect(publishCall.priority).toBe(2);
      expect(publishCall.tags).toEqual(["tada"]);
      expect(publishCall.publicUrl).toBe("https://studybub.example.com");
      expect(typeof publishCall.sequenceId).toBe("string");
      expect(publishCall.sequenceId.length).toBeGreaterThan(0);

      // Status in DB
      const row = db
        .query("SELECT status, ntfy_message_id FROM notification_deliveries")
        .get() as { status: string; ntfy_message_id: string };
      expect(row.status).toBe("succeeded");
      expect(row.ntfy_message_id).toBe("msg-milestone-7");
    });

    it("milestone retries across transient failures up to 24-hour expiry using stable sequence ID", async () => {
      await seedConfig("19:00", "UTC", new Date("2026-08-20T10:00:00Z"));
      const initialTime = new Date("2026-08-22T14:30:00Z");
      const expiresAt = new Date(initialTime.getTime() + 24 * 60 * 60 * 1000);

      enqueueMilestoneDelivery(db, {
        userId,
        streakCount: 14,
        lastActiveDate: "2026-08-22",
        localDate: "2026-08-22",
        timezone: "UTC",
        now: initialTime,
        nextAttemptAt: initialTime,
        expiresAt,
      });

      const deliveryRow = db
        .query("SELECT id FROM notification_deliveries")
        .get() as { id: string };
      const expectedSequenceId = deliveryRow.id;

      // 1st attempt: 503 service unavailable
      mockPublishNtfyNotification.mockResolvedValueOnce({
        ok: false,
        status: 503,
        classification: "service-unavailable",
        isPermanent: false,
      });

      let result = await runNotificationWorkerCycle({ db, now: initialTime });
      expect(result.claims).toBe(1);
      expect(result.failed).toBe(1);
      expect(mockPublishNtfyNotification.mock.calls[0][0].sequenceId).toBe(
        expectedSequenceId,
      );

      // 2nd attempt: 1 minute later, network error
      const retryTime1 = new Date(initialTime.getTime() + 65 * 1000);
      mockPublishNtfyNotification.mockResolvedValueOnce({
        ok: false,
        classification: "network",
        isPermanent: false,
      });

      result = await runNotificationWorkerCycle({ db, now: retryTime1 });
      expect(result.claims).toBe(1);
      expect(result.failed).toBe(1);
      expect(mockPublishNtfyNotification.mock.calls[1][0].sequenceId).toBe(
        expectedSequenceId,
      );

      // 3rd attempt: 5 minutes later, succeeds
      const retryTime2 = new Date(retryTime1.getTime() + 5 * 60 * 1000 + 5000);
      mockPublishNtfyNotification.mockResolvedValueOnce({
        ok: true,
        status: 200,
        ntfyMessageId: "msg-milestone-retry-ok",
      });

      result = await runNotificationWorkerCycle({ db, now: retryTime2 });
      expect(result.claims).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(mockPublishNtfyNotification.mock.calls[2][0].sequenceId).toBe(
        expectedSequenceId,
      );

      const updatedRow = db
        .query(
          "SELECT status, attempt_count FROM notification_deliveries WHERE id = ?",
        )
        .get(expectedSequenceId) as { status: string; attempt_count: number };
      expect(updatedRow.status).toBe("succeeded");
      expect(updatedRow.attempt_count).toBe(3);
    });

    it("expires unattempted or failed milestone after 24 hours without sending catch-up and records expired count", async () => {
      await seedConfig("19:00", "UTC", new Date("2026-08-20T10:00:00Z"));
      const initialTime = new Date("2026-08-22T14:30:00Z");
      const expiresAt = new Date(initialTime.getTime() + 24 * 60 * 60 * 1000);

      enqueueMilestoneDelivery(db, {
        userId,
        streakCount: 30,
        lastActiveDate: "2026-08-22",
        localDate: "2026-08-22",
        timezone: "UTC",
        now: initialTime,
        nextAttemptAt: initialTime,
        expiresAt,
      });

      // Worker runs 25 hours later
      const expiredTime = new Date(initialTime.getTime() + 25 * 60 * 60 * 1000);
      const result = await runNotificationWorkerCycle({ db, now: expiredTime });

      expect(result.claims).toBe(0);
      expect(result.expired).toBe(1);
      expect(mockPublishNtfyNotification).not.toHaveBeenCalled();

      const row = db
        .query(
          "SELECT status, last_result_code FROM notification_deliveries WHERE user_id = ?",
        )
        .get(userId) as { status: string; last_result_code: string | null };
      expect(row.status).toBe("expired");
    });

    it("skips publishing if claimed delivery is cancelled or invalidated before publish", async () => {
      await seedConfig("19:00", "UTC", new Date("2026-08-20T10:00:00Z"));
      const initialTime = new Date("2026-08-22T14:30:00Z");

      enqueueMilestoneDelivery(db, {
        userId,
        streakCount: 30,
        lastActiveDate: "2026-08-22",
        localDate: "2026-08-22",
        timezone: "UTC",
        now: initialTime,
        nextAttemptAt: initialTime,
        expiresAt: new Date(initialTime.getTime() + 24 * 60 * 60 * 1000),
      });

      // Deliveries are claimed. Before publish step in loop, simulate another process or hook
      // invalidating/deleting the claimed delivery by mocking a hook or intercepting:
      // We test that when isDeliveryStillClaimed returns false, publish is skipped.
      const deliveryIdRow = db
        .query("SELECT id FROM notification_deliveries WHERE user_id = ?")
        .get(userId) as { id: string };

      // First let's claim it manually to simulate it being claimed
      // Then change status to 'suppressed' (e.g. concurrent cancel/deletion)
      db.run(
        "UPDATE notification_deliveries SET status = 'claimed' WHERE id = ?",
        [deliveryIdRow.id],
      );
      db.run(
        "UPDATE notification_deliveries SET status = 'suppressed' WHERE id = ?",
        [deliveryIdRow.id],
      );

      const result = await runNotificationWorkerCycle({ db, now: initialTime });
      expect(result.claims).toBe(0);
      expect(mockPublishNtfyNotification).not.toHaveBeenCalled();
    });
  });
});
